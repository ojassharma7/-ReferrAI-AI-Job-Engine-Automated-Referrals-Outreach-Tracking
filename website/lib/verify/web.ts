// Passive signal #2: read a candidate's portfolio / personal site (zero effort —
// they just paste the link, the AI reads it). Extracts title, description, and
// the meaningful text so the assessment can cite real projects/claims.
//
// SECURITY: the URL is candidate-controlled, so this is a classic SSRF surface.
// We resolve the host and reject anything pointing at a private/reserved network
// (localhost, RFC1918, link-local incl. the 169.254.169.254 cloud-metadata
// endpoint, CGNAT, IPv6 loopback/ULA), and re-validate on every redirect hop.

import { lookup } from 'node:dns/promises';

export interface SiteEvidence {
  found: boolean;
  url?: string;
  title?: string;
  description?: string;
  text?: string; // cleaned, capped body text
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;
const META_RES: Record<string, RegExp> = {
  description: /<meta[^>]+(?:name|property)=["']description["'][^>]*content=["']([^"']+)["']/i,
  'og:description': /<meta[^>]+(?:name|property)=["']og:description["'][^>]*content=["']([^"']+)["']/i,
};

function meta(html: string, name: keyof typeof META_RES): string | undefined {
  return META_RES[name].exec(html)?.[1];
}

// --- SSRF guard -------------------------------------------------------------

function isPrivateV4(addr: string): boolean {
  const p = addr.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // treat anything malformed as unsafe
  }
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true; // this-network, RFC1918, loopback
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + test-net
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  return false;
}

function isPrivateAddr(addr: string, family: number): boolean {
  if (family === 4) return isPrivateV4(addr);
  const ip = addr.toLowerCase();
  if (ip === '::1' || ip === '::') return true; // loopback / unspecified
  if (ip.startsWith('fe80') || ip.startsWith('fc') || ip.startsWith('fd')) return true; // link-local / ULA
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip); // IPv4-mapped
  if (mapped) return isPrivateV4(mapped[1]);
  return false;
}

// Returns the parsed URL only if it is http(s) and every resolved address is public.
async function assertPublicUrl(rawUrl: string): Promise<URL | null> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return null;
  }

  try {
    // Resolve every address the host maps to — catches raw IP literals AND
    // hostnames that (re)bind to internal ranges.
    const addrs = await lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => isPrivateAddr(a.address, a.family))) return null;
  } catch {
    return null;
  }
  return parsed;
}

// Fetch with manual redirects so each hop is re-validated against the SSRF guard.
async function safeFetch(start: URL): Promise<Response | null> {
  const signal = AbortSignal.timeout(10_000);
  let current: URL | null = start;
  for (let hop = 0; hop < 4; hop++) {
    if (!current) return null;
    const res = await fetch(current, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal,
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return null;
      current = await assertPublicUrl(new URL(loc, current).href);
      continue;
    }
    return res;
  }
  return null; // too many redirects
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
  let raw = (rawUrl || '').trim();
  if (!raw) return { found: false };
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  const start = await assertPublicUrl(raw);
  if (!start) return { found: false };

  try {
    const res = await safeFetch(start);
    if (!res || !res.ok) return { found: false };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return { found: false };
    const html = (await res.text()).slice(0, 400_000);

    const title = TITLE_RE.exec(html)?.[1]?.trim();
    const description = meta(html, 'description') || meta(html, 'og:description');
    const text = stripToText(html).slice(0, 3000);

    return { found: true, url: res.url || start.href, title, description, text };
  } catch {
    return { found: false };
  }
}
