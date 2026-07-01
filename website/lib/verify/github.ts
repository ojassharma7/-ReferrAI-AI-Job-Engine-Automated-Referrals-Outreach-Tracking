// Pull REAL public GitHub signals (no key needed; GitHub requires a User-Agent).
// This is the evidence that makes a "verified" profile checkable, not vibes.

export interface GitHubEvidence {
  found: boolean;
  login?: string;
  name?: string;
  bio?: string;
  followers?: number;
  publicRepos?: number;
  totalStars?: number;
  topLanguages?: string[];
  topRepos?: { name: string; stars: number; language?: string; description?: string; url: string }[];
  accountAgeYears?: number;
}

const UA = 'ReferrAI-verify';

export async function fetchGitHubEvidence(username: string): Promise<GitHubEvidence> {
  const u = (username || '').trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '');
  if (!u) return { found: false };
  const headers = { 'User-Agent': UA, Accept: 'application/vnd.github+json' };

  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!userRes.ok) return { found: false };
    const user = await userRes.json();

    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(u)}/repos?per_page=100&sort=pushed`,
      { headers, signal: AbortSignal.timeout(10_000) },
    );
    const repos: any[] = reposRes.ok ? await reposRes.json() : [];

    const owned = repos.filter((r) => !r.fork);
    const totalStars = owned.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const topRepos = [...owned]
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        stars: r.stargazers_count || 0,
        language: r.language || undefined,
        description: r.description || undefined,
        url: r.html_url,
      }));

    const langCount: Record<string, number> = {};
    for (const r of owned) if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
    const topLanguages = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([l]) => l);

    const ageYears = user.created_at
      ? Math.max(0, (Date.now() - new Date(user.created_at).getTime()) / (365 * 86_400_000))
      : undefined;

    return {
      found: true,
      login: user.login,
      name: user.name || undefined,
      bio: user.bio || undefined,
      followers: user.followers,
      publicRepos: user.public_repos,
      totalStars,
      topLanguages,
      topRepos,
      accountAgeYears: ageYears ? Math.round(ageYears * 10) / 10 : undefined,
    };
  } catch {
    return { found: false };
  }
}

// One-line signals suitable for the assessment/brief.
export function gitHubSignals(e: GitHubEvidence): string[] {
  if (!e.found) return [];
  const s: string[] = [];
  if (e.totalStars) s.push(`GitHub: ${e.totalStars} stars across ${e.topRepos?.length ?? 0} top repos`);
  if (e.topLanguages?.length) s.push(`Primary languages: ${e.topLanguages.slice(0, 4).join(', ')}`);
  if (e.followers) s.push(`${e.followers} GitHub followers`);
  if (e.accountAgeYears) s.push(`${e.accountAgeYears}-year-old GitHub account, ${e.publicRepos} public repos`);
  return s;
}
