// Best-effort persistence of a search result, scoped to the current user.
// Never throws into the request path — a DB hiccup should not fail a search.
import { createClient } from '@/lib/supabase/server';
import type { AppUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { SearchResult, Contact, Job } from '@/lib/types';

export async function persistSearchResult(
  user: AppUser,
  result: SearchResult,
): Promise<void> {
  if (!isSupabaseConfigured() || user.isDemo) return;

  try {
    const supabase = await createClient();
    const domain = result.company.domain?.trim() || null;

    // ---- company: find-or-create by (user_id, domain) ----
    let companyId: string | null = null;
    if (domain) {
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .ilike('domain', domain)
        .maybeSingle();
      companyId = existing?.id ?? null;
    }
    if (!companyId) {
      const { data: inserted } = await supabase
        .from('companies')
        .insert({
          user_id: user.id,
          name: result.company.name,
          domain,
          industry: result.company.industry ?? null,
          size: result.company.size ? String(result.company.size) : null,
          location: result.company.location ?? null,
          website: result.company.website ?? null,
          linkedin_url: result.company.linkedin_url ?? null,
        })
        .select('id')
        .single();
      companyId = inserted?.id ?? null;
    }

    // ---- contacts: dedup by existing emails for this user ----
    const allContacts: Contact[] = [
      ...result.recruiters,
      ...result.domainEmployees,
    ];
    if (allContacts.length > 0) {
      const emails = allContacts
        .map((c) => c.email?.toLowerCase())
        .filter((e): e is string => !!e);

      const existingEmails = new Set<string>();
      if (emails.length > 0) {
        const { data: existing } = await supabase
          .from('contacts')
          .select('email')
          .eq('user_id', user.id)
          .in('email', emails);
        existing?.forEach((r) => r.email && existingEmails.add(r.email.toLowerCase()));
      }

      const rows = allContacts
        .filter((c) => !c.email || !existingEmails.has(c.email.toLowerCase()))
        .map((c) => ({
          user_id: user.id,
          company_id: companyId,
          email: c.email || null,
          full_name: c.full_name || null,
          first_name: c.first_name || null,
          last_name: c.last_name || null,
          title: c.title || null,
          department: c.department || null,
          seniority: c.seniority ?? null,
          linkedin_url: c.linkedin_url || null,
          phone: c.phone || null,
          email_verified: !!c.email_verified,
          email_status: c.email_status ?? 'unknown',
          relevance_score: c.relevance_score ?? 50,
          source: c.source ?? null,
          is_recruiter: result.recruiters.includes(c),
        }));

      if (rows.length > 0) {
        await supabase.from('contacts').insert(rows);
      }
    }

    // ---- jobs: dedup by external_id for this user ----
    if (result.jobs.length > 0) {
      const externalIds = result.jobs.map((j) => j.id).filter(Boolean);
      const existingIds = new Set<string>();
      if (externalIds.length > 0) {
        const { data: existing } = await supabase
          .from('jobs')
          .select('external_id')
          .eq('user_id', user.id)
          .in('external_id', externalIds);
        existing?.forEach((r) => r.external_id && existingIds.add(r.external_id));
      }

      const rows = result.jobs
        .filter((j: Job) => !existingIds.has(j.id))
        .map((j: Job) => ({
          user_id: user.id,
          company_id: companyId,
          external_id: j.id,
          title: j.title,
          location: j.location ?? null,
          job_type: j.job_type ?? null,
          jd_text: j.jd_text ?? null,
          jd_url: j.jd_url ?? null,
          source: j.source ?? 'jsearch',
          posted_at: j.posted_at ?? null,
        }));

      if (rows.length > 0) {
        await supabase.from('jobs').insert(rows);
      }
    }
  } catch (err) {
    // Swallow: persistence is best-effort.
    console.warn('persistSearchResult failed:', err instanceof Error ? err.message : err);
  }
}
