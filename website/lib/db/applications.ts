// Pipeline (CRM) data layer. Each application ties together a job, an optional
// contact, and the documents you generated for it. Best-effort + graceful:
// demo mode returns sample cards so the board is explorable without Supabase.

import { createClient } from '@/lib/supabase/server';
import type { AppUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { mockApplications, mockDomain } from '@/lib/mock';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type ApplicationCard,
} from '@/lib/pipeline/constants';

export { APPLICATION_STATUSES };
export type { ApplicationStatus, ApplicationCard };

export interface CreateApplicationInput {
  jobExternalId?: string;
  jobTitle: string;
  company: string;
  jobLocation?: string;
  jdText?: string;
  jdUrl?: string;
  jobSource?: string;
  contactEmail?: string;
  contactName?: string;
  contactTitle?: string;
  status?: ApplicationStatus;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
export async function listApplications(user: AppUser): Promise<ApplicationCard[]> {
  if (!isSupabaseConfigured() || user.isDemo) {
    return mockApplications() as ApplicationCard[];
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('applications')
      .select(
        `id,status,notes,created_at,updated_at,
         jobs(title,location,companies(name)),
         contacts(full_name,title,email)`,
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    return (data ?? []).map((row: any) => ({
      id: row.id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      job: row.jobs
        ? {
            title: row.jobs.title ?? null,
            company: row.jobs.companies?.name ?? null,
            location: row.jobs.location ?? null,
          }
        : null,
      contact: row.contacts
        ? {
            full_name: row.contacts.full_name ?? null,
            title: row.contacts.title ?? null,
            email: row.contacts.email ?? null,
          }
        : null,
    }));
  } catch (err) {
    console.warn('listApplications failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// find-or-create helpers
// ---------------------------------------------------------------------------
async function resolveCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: AppUser,
  name: string,
): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', trimmed)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: inserted } = await supabase
    .from('companies')
    .insert({ user_id: user.id, name: trimmed, domain: mockDomain(trimmed) })
    .select('id')
    .single();
  return inserted?.id ?? null;
}

async function resolveJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: AppUser,
  companyId: string | null,
  input: CreateApplicationInput,
): Promise<string | null> {
  if (input.jobExternalId) {
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('external_id', input.jobExternalId)
      .maybeSingle();
    if (existing?.id) return existing.id;
  }
  const { data: inserted } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      company_id: companyId,
      external_id: input.jobExternalId ?? null,
      title: input.jobTitle,
      location: input.jobLocation ?? null,
      jd_text: input.jdText ?? null,
      jd_url: input.jdUrl ?? null,
      source: input.jobSource ?? 'manual',
    })
    .select('id')
    .single();
  return inserted?.id ?? null;
}

async function resolveContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: AppUser,
  companyId: string | null,
  input: CreateApplicationInput,
): Promise<string | null> {
  if (!input.contactEmail && !input.contactName) return null;
  if (input.contactEmail) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .ilike('email', input.contactEmail)
      .maybeSingle();
    if (existing?.id) return existing.id;
  }
  const { data: inserted } = await supabase
    .from('contacts')
    .insert({
      user_id: user.id,
      company_id: companyId,
      email: input.contactEmail ?? null,
      full_name: input.contactName ?? null,
      title: input.contactTitle ?? null,
    })
    .select('id')
    .single();
  return inserted?.id ?? null;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
export async function createApplication(
  user: AppUser,
  input: CreateApplicationInput,
): Promise<{ id: string | null; demo: boolean }> {
  if (!isSupabaseConfigured() || user.isDemo) return { id: null, demo: true };
  try {
    const supabase = await createClient();
    const companyId = await resolveCompany(supabase, user, input.company);
    const jobId = await resolveJob(supabase, user, companyId, input);
    const contactId = await resolveContact(supabase, user, companyId, input);

    const { data } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        job_id: jobId,
        contact_id: contactId,
        status: input.status ?? 'saved',
      })
      .select('id')
      .single();
    return { id: data?.id ?? null, demo: false };
  } catch (err) {
    console.warn('createApplication failed:', err instanceof Error ? err.message : err);
    return { id: null, demo: false };
  }
}

export async function updateApplication(
  user: AppUser,
  id: string,
  fields: { status?: ApplicationStatus; notes?: string },
): Promise<boolean> {
  if (!isSupabaseConfigured() || user.isDemo) return true; // optimistic in demo
  try {
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (fields.status) patch.status = fields.status;
    if (fields.notes !== undefined) patch.notes = fields.notes;
    if (Object.keys(patch).length === 0) return true;

    const { error } = await supabase
      .from('applications')
      .update(patch)
      .eq('user_id', user.id)
      .eq('id', id);
    return !error;
  } catch (err) {
    console.warn('updateApplication failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function deleteApplication(user: AppUser, id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || user.isDemo) return true;
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('user_id', user.id)
      .eq('id', id);
    return !error;
  } catch (err) {
    console.warn('deleteApplication failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
