// Hunter.io contact discovery — role-aware.
//
// Two Hunter features make results relevant instead of a generic exec sample:
//  - `company`: Hunter resolves the real domain from a company NAME, so we don't
//    have to guess it (e.g. "Zest AI" -> zest.ai, not zestai.com).
//  - `department`: filters to the relevant team (it/hr/sales/...), so a
//    "Data Scientist" search returns engineers/data scientists, not the COO.
// Results are then sorted by how well each title matches the searched role.

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const HUNTER_BASE_URL = 'https://api.hunter.io/v2';

export interface HunterContact {
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  linkedin_url?: string;
  phone?: string;
  verified: boolean;
  confidence_score: number;
  department?: string;
  source?: string;
}

// Map a free-text role to a Hunter department bucket.
// Departments Hunter supports: executive, it, finance, management, sales,
// legal, support, hr, marketing, communication, operations.
function departmentForRole(role: string): string | undefined {
  const r = role.toLowerCase();
  const has = (...k: string[]) => k.some((x) => r.includes(x));
  if (has('recruit', 'talent', 'sourcer', 'people ops', ' hr', 'human resource')) return 'hr';
  if (
    has(
      'data scien', 'machine learning', 'ml', ' ai', 'engineer', 'developer',
      'software', 'devops', 'sre', 'architect', 'programmer', 'scientist',
      'analyst', 'data', 'security', 'qa', 'sde', 'designer', 'ux', 'ui', 'technical',
    )
  )
    return 'it';
  if (has('product manager', 'product owner', 'program manager')) return 'management';
  if (has('market', 'growth', 'brand', 'content', 'seo', 'demand gen')) return 'marketing';
  if (has('sales', 'account exec', 'business development', 'bdr', 'sdr', 'revenue', 'partnership'))
    return 'sales';
  if (has('finance', 'account', 'controller', 'fp&a')) return 'finance';
  if (has('legal', 'counsel', 'compliance')) return 'legal';
  if (has('support', 'customer success', 'customer experience')) return 'support';
  if (has('operations', ' ops')) return 'operations';
  return undefined; // unknown role -> no department filter (return all, then sort)
}

function mapEmail(e: any): HunterContact {
  const first = e.first_name || '';
  const last = e.last_name || '';
  return {
    email: e.value || e.email || '',
    first_name: first,
    last_name: last,
    full_name:
      first && last ? `${first} ${last}` : first || last || (e.value?.split('@')[0] ?? 'Unknown'),
    title: e.position || e.title || '',
    linkedin_url: e.linkedin || e.linkedin_url || undefined,
    phone: e.phone_number || e.phone || undefined,
    verified: e.verification?.status === 'valid' || e.verified === true,
    confidence_score: e.confidence ?? e.confidence_score ?? 0,
    department: e.department || undefined,
    source: 'hunter',
  };
}

interface FetchOpts {
  company?: string;
  domain?: string;
  department?: string;
  limit?: number;
}

async function fetchContacts(opts: FetchOpts): Promise<HunterContact[]> {
  if (!HUNTER_API_KEY) throw new Error('HUNTER_API_KEY is not set');
  if (!opts.company && !opts.domain) return [];

  const params = new URLSearchParams({
    api_key: HUNTER_API_KEY,
    limit: String(opts.limit ?? 10),
  });
  // Prefer the company NAME (Hunter resolves the domain); fall back to a domain.
  if (opts.company) params.set('company', opts.company);
  else if (opts.domain) params.set('domain', opts.domain);
  if (opts.department) params.set('department', opts.department);

  const res = await fetch(`${HUNTER_BASE_URL}/domain-search?${params.toString()}`);
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Hunter.io API error (${res.status})`);
  }
  // Free tier returns partial data alongside a 400 pagination warning — still usable.
  const emails: any[] = json?.data?.emails ?? [];
  return emails.map(mapEmail);
}

// How well a title matches the searched role (higher = more relevant).
// Prefix matching so "Data Science" counts for a "Data Scientist" search.
function relevance(title: string, role: string): number {
  const t = (title || '').toLowerCase().trim();
  const r = role.toLowerCase().trim();
  if (!t) return 0;
  if (t.includes(r)) return 100; // exact role phrase
  const tokens = r.split(/\s+/).filter((x) => x.length > 2);
  if (!tokens.length) return 50;
  const hits = tokens.filter((tok) => t.includes(tok.slice(0, 5))).length;
  if (hits === tokens.length) return 90; // all role words present
  if (hits) return 55 + (hits - 1) * 15;
  return 10;
}

const NOISE = ['administrative assistant', 'executive assistant', 'assistant to', 'intern'];

function dropNoise(contacts: HunterContact[]): HunterContact[] {
  return contacts.filter((c) => {
    const t = (c.title || '').toLowerCase().trim();
    return !!t && !NOISE.some((n) => t.includes(n));
  });
}

/**
 * People at the company in (or near) the searched role.
 * `company` is the name (Hunter resolves the domain); `domain` is an optional hint.
 */
export async function searchDomainEmployees(
  company: string,
  role: string,
  domain?: string,
): Promise<HunterContact[]> {
  const department = departmentForRole(role);

  let contacts = await fetchContacts({ company, domain, department, limit: 10 });
  // If the department filter returned nothing, retry broader (no department).
  if (contacts.length === 0 && department) {
    contacts = await fetchContacts({ company, domain, limit: 10 });
  }

  const scored = dropNoise(contacts)
    .map((c) => ({ c, score: relevance(c.title, role) }))
    .sort((a, b) => b.score - a.score);

  // Precision: when genuine role matches exist, show ONLY those (e.g. just the
  // data scientists, not the DevOps/Systems folks). Otherwise fall back to the
  // whole department so the user still gets real people to reach out to.
  const relevant = scored.filter((x) => x.score >= 55);
  const chosen = relevant.length ? relevant : scored;
  return chosen.map((x) => x.c).slice(0, 12);
}

/**
 * Recruiters / talent / HR at the company (people who can route a referral).
 */
export async function searchRecruiters(
  company: string,
  domain?: string,
): Promise<HunterContact[]> {
  const contacts = dropNoise(await fetchContacts({ company, domain, department: 'hr', limit: 25 }));

  const recruiterKw = ['recruit', 'talent', 'hiring', 'sourc', 'people'];
  const recruiters = contacts.filter((c) =>
    recruiterKw.some((k) => (c.title || '').toLowerCase().includes(k)),
  );
  // Prefer explicit recruiters; otherwise the HR team can still route a referral.
  return (recruiters.length ? recruiters : contacts).slice(0, 8);
}
