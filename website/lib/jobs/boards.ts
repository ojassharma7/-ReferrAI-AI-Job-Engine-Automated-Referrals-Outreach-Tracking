// Company ATS job boards (Greenhouse + Lever) — free, complete, with valid
// apply links. Most tech companies publish their full openings here, so this is
// far better than a generic aggregator for "jobs at <company>".

import type { JobSearchResult } from '@/lib/job-search-client';
import { titleMatchesRole } from '@/lib/roles';
import { boardSlugs } from '@/lib/company/resolve';

function stripHtml(s: string): string {
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TIMEOUT = 15_000;

export async function fetchGreenhouseJobs(
  company: string,
  role: string,
  domain?: string,
): Promise<JobSearchResult[]> {
  for (const slug of boardSlugs(company, domain)) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
        { signal: AbortSignal.timeout(TIMEOUT) },
      );
      if (!res.ok) continue; // try next slug variant
      const data = await res.json();
      const jobs: any[] = data.jobs ?? [];
      if (!jobs.length) continue;

      // Right board found — return its role matches (even if 0; don't try others).
      return jobs
        .filter((j) => titleMatchesRole(j.title || '', role))
        .map((j) => ({
          job_id: `gh-${j.id}`,
          employer_name: company,
          job_title: j.title,
          job_description: stripHtml(j.content || '').slice(0, 5000),
          job_apply_link: j.absolute_url,
          job_city: j.location?.name,
          job_posted_at_datetime_utc: j.updated_at,
          job_employment_type: undefined,
        }));
    } catch {
      // network/timeout — try next variant
    }
  }
  return [];
}

export async function fetchLeverJobs(
  company: string,
  role: string,
  domain?: string,
): Promise<JobSearchResult[]> {
  for (const slug of boardSlugs(company, domain)) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) continue;

      return data
        .filter((j) => titleMatchesRole(j.text || '', role))
        .map((j) => ({
          job_id: `lever-${j.id}`,
          employer_name: company,
          job_title: j.text,
          job_description: (j.descriptionPlain || stripHtml(j.description || '')).slice(0, 5000),
          job_apply_link: j.hostedUrl,
          job_city: j.categories?.location,
          job_posted_at_datetime_utc: j.createdAt
            ? new Date(j.createdAt).toISOString()
            : undefined,
          job_employment_type: j.categories?.commitment,
        }));
    } catch {
      // try next variant
    }
  }
  return [];
}

// Ashby (Notion, Ramp, Perplexity, many AI startups). Needs a browser UA or it
// 403s. The list endpoint has no description, so we link to the full posting.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

export async function fetchAshbyJobs(
  company: string,
  role: string,
  domain?: string,
): Promise<JobSearchResult[]> {
  for (const slug of boardSlugs(company, domain)) {
    try {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`, {
        headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const jobs: any[] = data.jobs ?? [];
      if (!jobs.length) continue;

      return jobs
        .filter((j) => (j.isListed ?? true) && titleMatchesRole(j.title || '', role))
        .map((j) => ({
          job_id: `ashby-${j.id}`,
          employer_name: company,
          job_title: j.title,
          job_description: `${j.title}${j.team ? ` · ${j.team}` : ''} at ${company}${
            j.location ? ` (${j.location})` : ''
          }. View the full description via the apply link.`,
          job_apply_link: j.jobUrl || `https://jobs.ashbyhq.com/${slug}/${j.id}`,
          job_city: j.location,
          job_employment_type: j.employmentType,
          job_posted_at_datetime_utc: j.publishedAt,
        }));
    } catch {
      // try next variant
    }
  }
  return [];
}

// The company's real openings from whichever ATS they use.
export async function fetchCompanyBoardJobs(
  company: string,
  role: string,
  domain?: string,
): Promise<JobSearchResult[]> {
  const gh = await fetchGreenhouseJobs(company, role, domain);
  if (gh.length) return gh;
  const lever = await fetchLeverJobs(company, role, domain);
  if (lever.length) return lever;
  return fetchAshbyJobs(company, role, domain);
}
