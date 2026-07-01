// Passive signal #2: read a candidate's portfolio / personal site (zero effort —
// they just paste the link, the AI reads it). Extracts title, description, and
// the meaningful text so the assessment can cite real projects/claims.

export interface SiteEvidence {
  found: boolean;
  url?: string;
  title?: string;
  description?: string;
  text?: string; // cleaned, capped body text
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

function meta(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`,
    'i',
  );
  return re.exec(html)?.[1];
}

function stripToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchSiteEvidence(rawUrl: string): Promise<SiteEvidence> {
  let url = (rawUrl || '').trim();
  if (!url) return { found: false };
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    });
    if (!res.ok) return { found: false };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return { found: false };
    const html = (await res.text()).slice(0, 400_000);

    const title = /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1]?.trim();
    const description = meta(html, 'description') || meta(html, 'og:description');
    const text = stripToText(html).slice(0, 3000);

    return { found: true, url, title, description, text };
  } catch {
    return { found: false };
  }
}
