// Shared role matching/scoring used by job boards, contact discovery, and the
// search route — so "Data Scientist" consistently matches the whole family
// (ML / Applied Scientist / Data Analyst / ...) instead of an exact string only.

const FAMILIES: Record<string, string[]> = {
  'data scientist': [
    'data scientist', 'data science', 'machine learning', 'ml engineer', 'ml scientist',
    'ai engineer', 'a.i. ', 'applied scientist', 'research scientist', 'data analyst',
    'analytics', 'statistician', 'deep learning', 'nlp', 'decision scientist',
  ],
  'machine learning engineer': [
    'machine learning', 'ml engineer', 'data scientist', 'ai engineer', 'applied scientist',
    'research scientist', 'deep learning', 'mlops',
  ],
  'software engineer': [
    'software engineer', 'software developer', 'backend', 'front end', 'frontend',
    'full stack', 'fullstack', 'sde', 'developer', 'programmer', 'platform engineer',
    'systems engineer', 'web developer', 'application engineer', 'engineer',
  ],
  'data engineer': [
    'data engineer', 'data platform', 'data infrastructure', 'analytics engineer',
    'etl', 'data pipeline', 'big data',
  ],
  'product manager': [
    'product manager', 'product owner', 'product lead', 'technical product',
    'group product', 'product management', 'program manager',
  ],
  'data analyst': [
    'data analyst', 'business analyst', 'analytics', 'bi analyst', 'reporting analyst',
    'insights analyst', 'data science',
  ],
  designer: ['designer', 'ux', 'ui', 'product design', 'design', 'researcher'],
  recruiter: ['recruiter', 'talent', 'sourcer', 'hiring', 'people', 'human resources'],
  marketing: ['marketing', 'growth', 'brand', 'content', 'demand gen', 'seo'],
  sales: ['sales', 'account executive', 'business development', 'revenue', 'partnerships'],
};

// Expand a free-text role into the list of keywords that count as a match.
export function roleKeywords(role: string): string[] {
  const r = (role || '').toLowerCase().trim();
  if (!r) return [];
  if (FAMILIES[r]) return FAMILIES[r];
  // partial family match (e.g. "senior data scientist" -> data scientist family)
  for (const key of Object.keys(FAMILIES)) {
    if (r.includes(key) || key.includes(r)) return FAMILIES[key];
  }
  return [r];
}

// True if a job/person title is relevant to the searched role.
export function titleMatchesRole(title: string, role: string): boolean {
  const t = (title || '').toLowerCase();
  if (!t) return false;
  const r = (role || '').toLowerCase().trim();
  if (!r) return true;
  if (t.includes(r)) return true;
  return roleKeywords(role).some((kw) => t.includes(kw));
}

// 0-100 relevance: exact role phrase = 100, family keyword = ~85, weak = low.
export function roleScore(title: string, role: string): number {
  const t = (title || '').toLowerCase().trim();
  const r = (role || '').toLowerCase().trim();
  if (!t) return 0;
  if (!r) return 50;
  if (t.includes(r)) return 100;
  const kws = roleKeywords(role);
  // longest matching keyword wins (more specific = higher)
  const matched = kws.filter((kw) => t.includes(kw));
  if (matched.length) {
    const best = Math.max(...matched.map((m) => m.length));
    return Math.min(96, 78 + best); // ~83-96
  }
  // partial: any significant role token present (prefix)
  const tokens = r.split(/\s+/).filter((x) => x.length > 2);
  const hits = tokens.filter((tok) => t.includes(tok.slice(0, 5))).length;
  if (hits) return 40 + hits * 12;
  return 12;
}
