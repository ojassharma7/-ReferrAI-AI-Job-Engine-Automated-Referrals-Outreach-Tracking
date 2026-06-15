// Format-locked LaTeX resume renderer.
//
// Design rules:
//   1. The template structure is FIXED. Only the user's content is injected.
//   2. Every injected string is escaped so user content can never break (or
//      inject) LaTeX. See escapeLatex().
//   3. Uses ONLY base LaTeX + geometry/hyperref/xcolor/array — no enumitem or
//      titlesec — so it compiles on a minimal TeX install (and serverless TeX).
//
// To add a real Overleaf template later: keep the same ResumeData contract and
// add a new entry to TEMPLATES (or branch the preamble/section markup on style).

import type { ResumeData } from './schema';

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

const LATEX_ESCAPES: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

// Single regex pass: String.replace scans the ORIGINAL string, so the braces we
// introduce in e.g. \textbackslash{} are never themselves re-escaped.
export function escapeLatex(input: string | undefined | null): string {
  if (!input) return '';
  return String(input).replace(/[\\{}&%$#_~^]/g, (ch) => LATEX_ESCAPES[ch]);
}

// URLs go into \href{...}; only a few characters are catcode-dangerous there.
function escapeUrl(input: string): string {
  return input
    .trim()
    .replace(/\\/g, '/')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/&/g, '\\&');
}

function ensureScheme(url: string): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/+/, '')}`;
}

// A clickable link showing `label`, or just escaped text if not a URL.
function link(url: string, label: string): string {
  if (!url) return '';
  return `\\href{${escapeUrl(ensureScheme(url))}}{${escapeLatex(label)}}`;
}

const SEP = ' \\;\\textbar\\; ';

function dateRange(start?: string, end?: string): string {
  const s = escapeLatex(start);
  const e = escapeLatex(end);
  if (s && e) return `${s} -- ${e}`;
  return s || e || '';
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface ResumeTemplate {
  id: string;
  label: string;
  description: string;
  accent: string; // hex without leading '#'
  margin: string; // geometry margin
  dense: boolean; // tighter vertical rhythm
}

export const TEMPLATES: Record<string, ResumeTemplate> = {
  modern: {
    id: 'modern',
    label: 'Modern',
    description: 'Slate accent, ruled section headers, balanced spacing.',
    accent: '1F2937',
    margin: '0.6in',
    dense: false,
  },
  compact: {
    id: 'compact',
    label: 'Compact',
    description: 'Teal accent, tighter spacing — fits more on one page.',
    accent: '0F766E',
    margin: '0.5in',
    dense: true,
  },
};

export const DEFAULT_TEMPLATE = 'modern';

export function listTemplates() {
  return Object.values(TEMPLATES).map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

function preamble(t: ResumeTemplate): string {
  const itemsep = t.dense ? '1pt' : '2pt';
  const topsep = t.dense ? '1pt' : '3pt';
  const secskip = t.dense ? '6pt' : '9pt';
  return `\\documentclass[11pt]{article}
\\usepackage[margin=${t.margin}]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{xcolor}
\\usepackage{array}

\\definecolor{accent}{HTML}{${t.accent}}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\renewcommand{\\baselinestretch}{1.02}

% Section header: colored bold label + full-width rule (replaces titlesec).
\\newcommand{\\rsection}[1]{%
  \\vspace{${secskip}}{\\large\\bfseries\\color{accent}#1}\\par\\vspace{1pt}%
  {\\color{accent!35}\\rule{\\linewidth}{0.9pt}}\\par\\vspace{3pt}%
}

% Tight bullet list via the base list environment (replaces enumitem).
\\newenvironment{rlist}{%
  \\begin{list}{$\\bullet$}{%
    \\setlength{\\leftmargin}{1.3em}%
    \\setlength{\\labelwidth}{0.8em}%
    \\setlength{\\labelsep}{0.5em}%
    \\setlength{\\itemsep}{${itemsep}}%
    \\setlength{\\parsep}{0pt}%
    \\setlength{\\topsep}{${topsep}}%
    \\setlength{\\partopsep}{0pt}%
  }%
}{\\end{list}}

% Two-column line: left bold, right pushed to the margin.
\\newcommand{\\headerrow}[2]{{\\bfseries #1}\\hfill #2\\par}
`;
}

function contactLine(data: ResumeData): string {
  const c = data.contact;
  const parts: string[] = [];
  if (c.email) parts.push(link(`mailto:${c.email}`, c.email));
  if (c.phone) parts.push(escapeLatex(c.phone));
  if (c.location) parts.push(escapeLatex(c.location));
  if (c.linkedin) parts.push(link(c.linkedin, 'LinkedIn'));
  if (c.github) parts.push(link(c.github, 'GitHub'));
  if (c.website) parts.push(link(c.website, 'Website'));
  return parts.join(SEP);
}

function bullets(items: string[]): string {
  const valid = items.map((b) => b.trim()).filter(Boolean);
  if (!valid.length) return '';
  const lines = valid.map((b) => `  \\item ${escapeLatex(b)}`).join('\n');
  return `\\begin{rlist}\n${lines}\n\\end{rlist}`;
}

function experienceSection(data: ResumeData): string {
  if (!data.experience.length) return '';
  const blocks = data.experience
    .map((e) => {
      const right = escapeLatex(e.location);
      const dates = dateRange(e.start, e.end);
      const titleLine = `{\\itshape ${escapeLatex(e.title)}}\\hfill {\\itshape ${dates}}\\par`;
      return [
        `\\headerrow{${escapeLatex(e.company)}}{${right}}`,
        titleLine,
        bullets(e.bullets),
        '\\vspace{3pt}',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
  return `\\rsection{Experience}\n${blocks}`;
}

function projectsSection(data: ResumeData): string {
  if (!data.projects.length) return '';
  const blocks = data.projects
    .map((p) => {
      const tech = p.tech ? ` \\textbar\\ {\\itshape ${escapeLatex(p.tech)}}` : '';
      const head = `{\\bfseries ${escapeLatex(p.name)}}${tech}\\par`;
      const desc = p.description ? `${escapeLatex(p.description)}\\par` : '';
      return [head, desc, bullets(p.bullets), '\\vspace{3pt}']
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
  return `\\rsection{Projects}\n${blocks}`;
}

function skillsSection(data: ResumeData): string {
  const groups = data.skills.filter((g) => g.items.filter(Boolean).length);
  if (!groups.length) return '';
  const rows = groups
    .map((g) => {
      const items = g.items.map((i) => escapeLatex(i)).join(', ');
      return g.category
        ? `{\\bfseries ${escapeLatex(g.category)}:}\\ ${items}\\par`
        : `${items}\\par`;
    })
    .join('\n');
  return `\\rsection{Skills}\n${rows}`;
}

function educationSection(data: ResumeData): string {
  if (!data.education.length) return '';
  const blocks = data.education
    .map((ed) => {
      const dates = dateRange(ed.start, ed.end);
      const second = [escapeLatex(ed.degree), dates].filter(Boolean);
      const secondLine = second.length
        ? `{\\itshape ${escapeLatex(ed.degree)}}\\hfill {\\itshape ${dates}}\\par`
        : '';
      const details = ed.details ? `${escapeLatex(ed.details)}\\par` : '';
      return [
        `\\headerrow{${escapeLatex(ed.school)}}{${escapeLatex(ed.location)}}`,
        secondLine,
        details,
        '\\vspace{2pt}',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
  return `\\rsection{Education}\n${blocks}`;
}

function certificationsSection(data: ResumeData): string {
  const certs = data.certifications.map((c) => c.trim()).filter(Boolean);
  if (!certs.length) return '';
  return `\\rsection{Certifications}\n${certs.map((c) => escapeLatex(c)).join(`${SEP}`)}\\par`;
}

export function renderResumeLatex(
  data: ResumeData,
  templateId: string = DEFAULT_TEMPLATE,
): string {
  const t = TEMPLATES[templateId] ?? TEMPLATES[DEFAULT_TEMPLATE];

  const headline = data.headline
    ? `  {\\small ${escapeLatex(data.headline)}}\\par\\vspace{2pt}\n`
    : '';
  const contact = contactLine(data);
  const header = `\\begin{center}
  {\\Huge\\bfseries\\color{accent} ${escapeLatex(data.name)}}\\par\\vspace{3pt}
${headline}  {\\small ${contact}}\\par
\\end{center}
\\vspace{2pt}`;

  const summary = data.summary
    ? `\\rsection{Summary}\n${escapeLatex(data.summary)}\\par`
    : '';

  const body = [
    summary,
    experienceSection(data),
    projectsSection(data),
    skillsSection(data),
    educationSection(data),
    certificationsSection(data),
  ]
    .filter(Boolean)
    .join('\n\n');

  return `${preamble(t)}
\\begin{document}
${header}

${body}
\\end{document}
`;
}

// Plain-text rendering — stored alongside the LaTeX for search/preview and
// backward compatibility with the old text-only resume field.
export function renderResumeText(data: ResumeData): string {
  const lines: string[] = [];
  lines.push(data.name);
  if (data.headline) lines.push(data.headline);
  const c = data.contact;
  const contact = [c.email, c.phone, c.location, c.linkedin, c.github, c.website]
    .filter(Boolean)
    .join(' | ');
  if (contact) lines.push(contact);
  if (data.summary) lines.push('', 'SUMMARY', data.summary);

  if (data.experience.length) {
    lines.push('', 'EXPERIENCE');
    for (const e of data.experience) {
      lines.push(
        `${e.title}, ${e.company}${e.location ? ` — ${e.location}` : ''} (${dateRangePlain(e.start, e.end)})`,
      );
      for (const b of e.bullets.filter(Boolean)) lines.push(`  • ${b}`);
    }
  }
  if (data.projects.length) {
    lines.push('', 'PROJECTS');
    for (const p of data.projects) {
      lines.push(`${p.name}${p.tech ? ` — ${p.tech}` : ''}`);
      if (p.description) lines.push(`  ${p.description}`);
      for (const b of p.bullets.filter(Boolean)) lines.push(`  • ${b}`);
    }
  }
  if (data.skills.length) {
    lines.push('', 'SKILLS');
    for (const g of data.skills) {
      lines.push(`${g.category ? `${g.category}: ` : ''}${g.items.join(', ')}`);
    }
  }
  if (data.education.length) {
    lines.push('', 'EDUCATION');
    for (const ed of data.education) {
      lines.push(
        `${ed.degree ? `${ed.degree}, ` : ''}${ed.school}${ed.location ? ` — ${ed.location}` : ''} (${dateRangePlain(ed.start, ed.end)})`,
      );
      if (ed.details) lines.push(`  ${ed.details}`);
    }
  }
  if (data.certifications.length) {
    lines.push('', 'CERTIFICATIONS', data.certifications.join(', '));
  }
  return lines.join('\n');
}

function dateRangePlain(start?: string, end?: string): string {
  if (start && end) return `${start} - ${end}`;
  return start || end || '';
}
