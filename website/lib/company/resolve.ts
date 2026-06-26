// Resolve a (possibly misspelled / informal) company name to a canonical name
// and domain via Clearbit's free autocomplete API (no key). The domain makes
// Hunter contact lookup reliable, and the canonical name/domain build the right
// ATS board slug.

export interface ResolvedCompany {
  name: string;
  domain: string;
}

export async function resolveCompany(query: string): Promise<ResolvedCompany | null> {
  const q = (query || '').trim();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;

    const lower = q.toLowerCase();
    const best =
      arr.find((a: any) => (a.name || '').toLowerCase() === lower) ||
      arr.find((a: any) => (a.name || '').toLowerCase().startsWith(lower)) ||
      arr[0];
    if (!best?.domain) return null;
    return { name: best.name || q, domain: best.domain };
  } catch {
    return null;
  }
}

// Candidate ATS (Greenhouse/Lever) board slugs for a company. The domain root is
// usually the slug (rippling.com -> rippling); name variants cover the rest.
export function boardSlugs(name: string, domain?: string): string[] {
  const slugs: string[] = [];
  if (domain) slugs.push(domain.split('.')[0]);
  const base = (name || '').toLowerCase().trim();
  if (base) {
    slugs.push(base.replace(/[^a-z0-9]/g, '')); // "zest ai" -> zestai
    slugs.push(base.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); // zest-ai
    slugs.push(base.split(/\s+/)[0].replace(/[^a-z0-9]/g, '')); // first word
  }
  return [...new Set(slugs)].filter(Boolean);
}
