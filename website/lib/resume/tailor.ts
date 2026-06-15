// Turn a free-form resume + a job description into structured, tailored
// ResumeData (+ a keyword match report). This is the ONLY place the LLM is
// involved in resume generation — and it emits JSON, never LaTeX.

import { callGemini } from '@/lib/gemini-client';
import { geminiLive } from '@/lib/mock';
import {
  TailorResultSchema,
  ResumeDataSchema,
  type TailorResult,
} from './schema';

export interface TailorInput {
  baseResume: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  keywords?: string[];
}

const SYSTEM = `You are an expert resume editor and ATS optimizer.
Your job: read a candidate's free-form resume and a target job, then produce a
TAILORED, STRUCTURED resume as JSON.

Hard rules:
- NEVER fabricate employers, job titles, dates, degrees, certifications, or
  metrics. Only use what the candidate's resume supports. Leave fields empty if
  unknown rather than inventing.
- You MAY reorder, rephrase, and re-emphasize to surface the most relevant
  experience first, and weave in job-description keywords ONLY where truthful.
- Bullets: start with a strong action verb; keep a metric when the source has
  one; 3-6 bullets per recent role.
- Keep it to roughly one to two pages of content.
- Respond with STRICT JSON ONLY — no markdown fences, no commentary.`;

function buildUserPrompt(input: TailorInput): string {
  const kw = input.keywords?.length
    ? `\nPriority keywords to include where truthful: ${input.keywords.join(', ')}`
    : '';
  return `TARGET JOB
Company: ${input.company}
Title: ${input.jobTitle}
Description:
${input.jobDescription}${kw}

CANDIDATE BASE RESUME (free-form):
"""
${input.baseResume}
"""

Return JSON with EXACTLY this shape (fill from the resume; empty string/array if unknown):
{
  "resume": {
    "name": "",
    "headline": "",
    "contact": {"email":"","phone":"","location":"","linkedin":"","github":"","website":""},
    "summary": "",
    "skills": [{"category":"","items":[]}],
    "experience": [{"company":"","title":"","location":"","start":"","end":"","bullets":[]}],
    "projects": [{"name":"","description":"","tech":"","bullets":[]}],
    "education": [{"school":"","degree":"","location":"","start":"","end":"","details":""}],
    "certifications": []
  },
  "match": {"score": 0, "matched": [], "missing": [], "notes": ""}
}
"match.score" is a 0-100 estimate of fit. "matched" = JD keywords present in the
tailored resume; "missing" = important JD keywords the resume does not support.`;
}

function extractJson(raw: string): unknown {
  let s = raw.trim();
  s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export interface TailorOutput {
  result: TailorResult;
  isMock: boolean;
  warning?: string;
}

export async function tailorResume(input: TailorInput): Promise<TailorOutput> {
  if (!geminiLive()) {
    return { result: mockTailor(input), isMock: true };
  }

  try {
    const raw = await callGemini(SYSTEM, buildUserPrompt(input));
    const parsed = extractJson(raw);

    const full = TailorResultSchema.safeParse(parsed);
    if (full.success) return { result: full.data, isMock: false };

    // Sometimes the model returns just the resume object; try to recover it.
    const resumeOnly = ResumeDataSchema.safeParse(
      (parsed as Record<string, unknown>)?.resume ?? parsed,
    );
    if (resumeOnly.success) {
      return {
        result: {
          resume: resumeOnly.data,
          match: { score: 0, matched: [], missing: [], notes: '' },
        },
        isMock: false,
        warning: 'Match report was unavailable for this generation.',
      };
    }

    return {
      result: mockTailor(input),
      isMock: true,
      warning: 'AI response could not be parsed; showing a structured draft.',
    };
  } catch (err) {
    return {
      result: mockTailor(input),
      isMock: true,
      warning: `AI tailoring failed (${err instanceof Error ? err.message : 'unknown error'}); showing a structured draft.`,
    };
  }
}

// ---------------------------------------------------------------------------
// Demo fallback — no Gemini key. Produces a real, renderable ResumeData from the
// pasted text so the full pipeline (text -> structured -> LaTeX -> PDF) works,
// clearly labeled as demo.
// ---------------------------------------------------------------------------
function looksLikeName(line: string): boolean {
  const words = line.trim().split(/\s+/);
  return (
    words.length >= 2 &&
    words.length <= 4 &&
    !/\d|@|http|\.com/i.test(line) &&
    line.length <= 40
  );
}

function mockTailor(input: TailorInput): TailorResult {
  const lines = input.baseResume
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const name = lines.length && looksLikeName(lines[0]) ? lines[0] : 'Your Name';
  const emailMatch = input.baseResume.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const bullets = lines
    .filter((l) => l !== name && l.length > 25)
    .slice(0, 5)
    .map((l) => (l.length > 180 ? `${l.slice(0, 177)}...` : l));

  const skillItems = (input.keywords ?? []).slice(0, 10);

  return {
    resume: {
      name,
      headline: input.jobTitle,
      contact: {
        email: emailMatch?.[0] ?? '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',
      },
      summary: `Demo mode — add GEMINI_API_KEY for real AI tailoring. Draft positioned for the ${input.jobTitle} role at ${input.company}, drawn from your pasted resume below.`,
      skills: skillItems.length
        ? [{ category: 'Key skills', items: skillItems }]
        : [],
      experience: bullets.length
        ? [
            {
              company: input.company,
              title: input.jobTitle,
              location: '',
              start: '',
              end: '',
              bullets,
            },
          ]
        : [],
      projects: [],
      education: [],
      certifications: [],
    },
    match: {
      score: skillItems.length ? 60 : 50,
      matched: skillItems.slice(0, 5),
      missing: [],
      notes: 'Demo match report — connect Gemini for a real keyword analysis.',
    },
  };
}
