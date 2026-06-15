// Outreach sequence data layer. Best-effort + graceful (demo returns samples).
//
// Sending model: steps are created with a scheduled_for time. A cron hits
// processDueSteps() to send any that are due, as long as the sequence is still
// active (a reply flips it to 'replied' and pending steps are skipped). Real
// Gmail sending is a dry-run here (marks sent + logs an email row); wire
// SEND_EMAILS + Gmail to actually deliver.

import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { AppUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { mockSequences } from '@/lib/mock';
import { draftSequence } from '@/lib/outreach/draft';
import type { SequenceView, SequenceStatus } from '@/lib/outreach/constants';
import { gmailConfigured, sendGmail, threadHasReply } from '@/lib/email/gmail';

const DAY_MS = 86_400_000;

export interface CreateSequenceInput {
  contactEmail?: string;
  contactName: string;
  contactTitle?: string;
  company: string;
  jobTitle: string;
  jobExternalId?: string;
  candidateProfile?: string;
  proofPoint?: string;
}

export async function createSequence(
  user: AppUser,
  input: CreateSequenceInput,
): Promise<{ id: string | null; demo: boolean; isMock: boolean }> {
  const { steps, isMock } = await draftSequence({
    contactName: input.contactName,
    contactTitle: input.contactTitle,
    company: input.company,
    jobTitle: input.jobTitle,
    candidateProfile: input.candidateProfile,
    proofPoint: input.proofPoint,
  });

  if (!isSupabaseConfigured() || user.isDemo) return { id: null, demo: true, isMock };

  try {
    const supabase = await createClient();

    // Best-effort links to existing contact/job (denormalized fields cover display).
    let contactId: string | null = null;
    if (input.contactEmail) {
      const { data } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .ilike('email', input.contactEmail)
        .maybeSingle();
      contactId = data?.id ?? null;
    }
    let jobId: string | null = null;
    if (input.jobExternalId) {
      const { data } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('external_id', input.jobExternalId)
        .maybeSingle();
      jobId = data?.id ?? null;
    }

    const { data: seq } = await supabase
      .from('sequences')
      .insert({
        user_id: user.id,
        contact_id: contactId,
        job_id: jobId,
        contact_email: input.contactEmail ?? null,
        contact_name: input.contactName,
        contact_title: input.contactTitle ?? null,
        company: input.company,
        job_title: input.jobTitle,
        status: 'active',
      })
      .select('id')
      .single();

    if (!seq?.id) return { id: null, demo: false, isMock };

    const now = Date.now();
    const rows = steps.map((s) => ({
      sequence_id: seq.id,
      user_id: user.id,
      step_no: s.step_no,
      send_after_days: s.send_after_days,
      subject: s.subject,
      body: s.body,
      status: 'pending',
      scheduled_for: new Date(now + s.send_after_days * DAY_MS).toISOString(),
    }));
    await supabase.from('sequence_steps').insert(rows);

    return { id: seq.id, demo: false, isMock };
  } catch (err) {
    console.warn('createSequence failed:', err instanceof Error ? err.message : err);
    return { id: null, demo: false, isMock };
  }
}

export async function listSequences(user: AppUser): Promise<SequenceView[]> {
  if (!isSupabaseConfigured() || user.isDemo) {
    return mockSequences() as SequenceView[];
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('sequences')
      .select(
        `id,status,contact_name,contact_email,contact_title,company,job_title,created_at,updated_at,
         sequence_steps(id,step_no,send_after_days,subject,body,status,scheduled_for,sent_at)`,
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    return (data ?? []).map((row: any) => ({
      id: row.id,
      status: row.status,
      contact_name: row.contact_name,
      contact_email: row.contact_email,
      contact_title: row.contact_title,
      company: row.company,
      job_title: row.job_title,
      created_at: row.created_at,
      updated_at: row.updated_at,
      steps: (row.sequence_steps ?? [])
        .sort((a: any, b: any) => a.step_no - b.step_no)
        .map((s: any) => ({
          id: s.id,
          step_no: s.step_no,
          send_after_days: s.send_after_days,
          subject: s.subject,
          body: s.body,
          status: s.status,
          scheduled_for: s.scheduled_for,
          sent_at: s.sent_at,
        })),
    }));
  } catch (err) {
    console.warn('listSequences failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

// Stop a sequence or mark it replied; either way, pending steps are skipped so
// no further follow-ups go out.
export async function updateSequenceStatus(
  user: AppUser,
  id: string,
  status: SequenceStatus,
): Promise<boolean> {
  if (!isSupabaseConfigured() || user.isDemo) return true;
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('sequences')
      .update({ status })
      .eq('user_id', user.id)
      .eq('id', id);
    if (error) return false;

    if (status === 'replied' || status === 'stopped') {
      await supabase
        .from('sequence_steps')
        .update({ status: 'skipped' })
        .eq('user_id', user.id)
        .eq('sequence_id', id)
        .eq('status', 'pending');
    }
    return true;
  } catch (err) {
    console.warn('updateSequenceStatus failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

// Cron worker: send all due steps for active sequences. Uses the service-role
// client (no user session). Dry-run send = log an email row + mark step sent.
export async function processDueSteps(): Promise<{
  processed: number;
  demo?: boolean;
  note?: string;
}> {
  if (!isSupabaseConfigured()) return { processed: 0, demo: true };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { processed: 0, note: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  }

  try {
    const supabase = createServiceClient();
    const nowISO = new Date().toISOString();

    const { data: due } = await supabase
      .from('sequence_steps')
      .select('id,sequence_id,user_id,step_no,subject,body,sequences(status,contact_email,thread_id)')
      .eq('status', 'pending')
      .lte('scheduled_for', nowISO)
      .limit(200);

    // Earlier steps first so a thread exists before follow-ups reference it.
    const steps = ((due ?? []) as any[]).sort((a, b) => a.step_no - b.step_no);

    const live = gmailConfigured();
    let processed = 0;
    const touchedSequences = new Set<string>();
    // Thread id discovered for a sequence during this run (step 1 -> follow-ups).
    const threadBySeq = new Map<string, string | undefined>();

    for (const step of steps) {
      const seq = step.sequences;
      if (seq?.status !== 'active') continue;

      const recipient: string | undefined = seq.contact_email || undefined;
      const threadId = threadBySeq.get(step.sequence_id) ?? seq.thread_id ?? undefined;

      let sentThreadId: string | undefined = threadId;

      if (live) {
        if (!recipient) {
          // Can't deliver without an address — skip this step.
          await supabase.from('sequence_steps').update({ status: 'skipped' }).eq('id', step.id);
          touchedSequences.add(step.sequence_id);
          continue;
        }
        const res = await sendGmail({
          to: recipient,
          subject: step.subject,
          body: step.body,
          threadId,
        });
        if (!res.success) {
          // Leave pending; the next cron run retries.
          continue;
        }
        sentThreadId = res.threadId ?? threadId;
        if (sentThreadId && sentThreadId !== seq.thread_id) {
          await supabase
            .from('sequences')
            .update({ thread_id: sentThreadId })
            .eq('id', step.sequence_id);
        }
        threadBySeq.set(step.sequence_id, sentThreadId);
        await supabase.from('usage_log').insert({ user_id: step.user_id, action: 'send' });
      }
      // When Gmail isn't configured we fall through to a dry-run: log the email
      // and mark the step sent so the sequence flow is visible end-to-end.

      const { data: email } = await supabase
        .from('emails')
        .insert({
          user_id: step.user_id,
          subject: step.subject,
          body: step.body,
          status: 'sent',
          thread_id: sentThreadId ?? null,
          sent_at: nowISO,
        })
        .select('id')
        .single();

      await supabase
        .from('sequence_steps')
        .update({ status: 'sent', sent_at: nowISO, email_id: email?.id ?? null })
        .eq('id', step.id);

      processed += 1;
      touchedSequences.add(step.sequence_id);
    }

    // Mark sequences completed when nothing is left pending.
    for (const seqId of touchedSequences) {
      const { count } = await supabase
        .from('sequence_steps')
        .select('id', { count: 'exact', head: true })
        .eq('sequence_id', seqId)
        .eq('status', 'pending');
      if ((count ?? 0) === 0) {
        await supabase.from('sequences').update({ status: 'completed' }).eq('id', seqId);
      }
    }

    return { processed };
  } catch (err) {
    console.warn('processDueSteps failed:', err instanceof Error ? err.message : err);
    return { processed: 0, note: 'error' };
  }
}

// Cron worker: poll Gmail threads of active sequences and flip any that got a
// reply to 'replied' (which skips their remaining steps). No-op without Gmail.
export async function checkReplies(): Promise<{
  checked: number;
  replied: number;
  demo?: boolean;
  note?: string;
}> {
  if (!isSupabaseConfigured()) return { checked: 0, replied: 0, demo: true };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { checked: 0, replied: 0, note: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  }
  if (!gmailConfigured()) return { checked: 0, replied: 0, note: 'Gmail not configured' };

  try {
    const supabase = createServiceClient();
    const { data: active } = await supabase
      .from('sequences')
      .select('id,thread_id')
      .eq('status', 'active')
      .not('thread_id', 'is', null)
      .limit(500);

    let replied = 0;
    const rows = (active ?? []) as { id: string; thread_id: string }[];
    for (const seq of rows) {
      if (!(await threadHasReply(seq.thread_id))) continue;
      await supabase.from('sequences').update({ status: 'replied' }).eq('id', seq.id);
      await supabase
        .from('sequence_steps')
        .update({ status: 'skipped' })
        .eq('sequence_id', seq.id)
        .eq('status', 'pending');
      replied += 1;
    }

    return { checked: rows.length, replied };
  } catch (err) {
    console.warn('checkReplies failed:', err instanceof Error ? err.message : err);
    return { checked: 0, replied: 0, note: 'error' };
  }
}
