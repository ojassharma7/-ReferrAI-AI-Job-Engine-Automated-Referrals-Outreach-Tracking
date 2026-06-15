// Persist outreach emails. Best-effort; no-op in demo mode.
import { createClient } from '@/lib/supabase/server';
import type { AppUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface SaveEmailInput {
  subject?: string;
  body?: string;
  status?: 'draft' | 'sent' | 'replied' | 'bounced';
  thread_id?: string;
  contact_email?: string;
  job_external_id?: string;
  sent_at?: string;
}

export async function saveEmail(
  user: AppUser,
  input: SaveEmailInput,
): Promise<string | null> {
  if (!isSupabaseConfigured() || user.isDemo) return null;

  try {
    const supabase = await createClient();

    let contactId: string | null = null;
    if (input.contact_email) {
      const { data } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .ilike('email', input.contact_email)
        .maybeSingle();
      contactId = data?.id ?? null;
    }

    let jobId: string | null = null;
    if (input.job_external_id) {
      const { data } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('external_id', input.job_external_id)
        .maybeSingle();
      jobId = data?.id ?? null;
    }

    const { data } = await supabase
      .from('emails')
      .insert({
        user_id: user.id,
        contact_id: contactId,
        job_id: jobId,
        subject: input.subject ?? null,
        body: input.body ?? null,
        status: input.status ?? 'draft',
        thread_id: input.thread_id ?? null,
        sent_at: input.sent_at ?? null,
      })
      .select('id')
      .single();

    return data?.id ?? null;
  } catch (err) {
    console.warn('saveEmail failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
