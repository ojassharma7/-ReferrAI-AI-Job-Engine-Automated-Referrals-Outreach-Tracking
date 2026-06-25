// Job search client.
// Provider priority: Adzuna (free, reliable) -> JSearch (RapidAPI) -> demo data.

import { adzunaLive, jsearchLive, mockJobs } from '@/lib/mock';
import { fetchCompanyBoardJobs } from '@/lib/jobs/boards';

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;
const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com';

export interface JobSearchResult {
  job_id: string;
  employer_name: string;
  employer_logo?: string;
  job_title: string;
  job_description?: string;
  job_employment_type?: string;
  job_apply_link?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_posted_at_datetime_utc?: string;
  job_google_link?: string;
}

export interface JobSearchResponse {
  data: JobSearchResult[];
  parameters: { query: string; page?: number; num_pages?: number };
  status: string;
}

/**
 * Search for jobs. Uses Adzuna when configured, else JSearch, else demo data.
 */
export async function searchJobs(
  company: string,
  role: string,
  location?: string,
): Promise<JobSearchResult[]> {
  // 1. The company's own ATS board (Greenhouse/Lever): real, complete openings
  //    with valid apply links. Best source for "jobs at <company>".
  try {
    const board = await fetchCompanyBoardJobs(company, role);
    if (board.length > 0) return board.slice(0, 30);
  } catch (e) {
    console.warn('Board fetch failed:', e instanceof Error ? e.message : e);
  }

  // 2. Adzuna (broad role match) as a supplement.
  if (adzunaLive()) {
    const jobs = await searchJobsAdzuna(company, role, location);
    if (jobs.length > 0) return jobs;
  }
  if (jsearchLive()) {
    const jobs = await searchJobsJSearch(company, role, location);
    if (jobs.length > 0) return jobs;
  }

  // 3. Demo jobs ONLY when no real provider is configured. For live users we
  //    return empty (the UI shows a "see all on LinkedIn" link) rather than fake
  //    listings with dead apply links.
  if (adzunaLive() || jsearchLive()) return [];
  return mockJobs(company, role);
}

// ---------------------------------------------------------------------------
// Adzuna (https://developer.adzuna.com/)
// ---------------------------------------------------------------------------
function stripHtml(s: string | undefined): string {
  if (!s) return '';
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchJobsAdzuna(
  company: string,
  role: string,
  location?: string,
): Promise<JobSearchResult[]> {
  const appId = process.env.ADZUNA_APP_ID as string;
  const appKey = process.env.ADZUNA_APP_KEY as string;
  const country = (process.env.ADZUNA_COUNTRY || 'us').toLowerCase();

  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: '15',
      what: `${role} ${company}`.trim(),
      'content-type': 'application/json',
    });
    if (location) params.set('where', location);

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Adzuna error (${res.status}):`, (await res.text()).slice(0, 200));
      return [];
    }
    const data = await res.json();
    const results: any[] = data.results ?? [];

    const jobs: JobSearchResult[] = results.map((r) => ({
      job_id: String(r.id ?? `adzuna-${Math.random().toString(36).slice(2)}`),
      employer_name: r.company?.display_name ?? 'Unknown',
      job_title: stripHtml(r.title),
      job_description: stripHtml(r.description),
      job_employment_type:
        r.contract_time === 'part_time'
          ? 'Part-time'
          : r.contract_time === 'full_time'
            ? 'Full-time'
            : undefined,
      job_apply_link: r.redirect_url,
      job_city: r.location?.display_name,
      job_country: country.toUpperCase(),
      job_posted_at_datetime_utc: r.created,
    }));

    // Soft-prioritize jobs actually at the searched company (don't exclude others).
    const c = company.toLowerCase();
    jobs.sort((a, b) => {
      const am = a.employer_name.toLowerCase().includes(c) ? 0 : 1;
      const bm = b.employer_name.toLowerCase().includes(c) ? 0 : 1;
      return am - bm;
    });
    return jobs;
  } catch (err) {
    console.error('Adzuna search failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// JSearch (RapidAPI) — kept as a fallback provider
// ---------------------------------------------------------------------------
async function searchJobsJSearch(
  company: string,
  role: string,
  location?: string,
): Promise<JobSearchResult[]> {
  try {
    const query = location
      ? `${role} at ${company} in ${location}`
      : `${role} at ${company}`;
    const url = `${JSEARCH_BASE_URL}/search?query=${encodeURIComponent(query)}&page=1&num_pages=1`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': JSEARCH_API_KEY as string,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });
    if (!response.ok) {
      console.error(`JSearch API error (${response.status})`);
      return [];
    }
    const data: JobSearchResponse = await response.json();
    return data.status === 'OK' && data.data ? data.data : [];
  } catch (error) {
    console.error('JSearch search failed:', error instanceof Error ? error.message : error);
    return [];
  }
}
