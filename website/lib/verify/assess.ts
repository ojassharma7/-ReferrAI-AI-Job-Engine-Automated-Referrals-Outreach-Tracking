// The verification brain — LOW FRICTION by design.
//
// Effort is on the AI, not the candidate:
//  - Passive by default: candidate links GitHub + portfolio (~10s); we read both
//    and score competence from real evidence.
//  - Optional 60-second boost: ONE adaptive question (returned as `oneQuestion`);
//    if the candidate answers (`liveAnswer`), it's weighed as a live, hard-to-fake
//    signal. No 20-minute test.
// Gemini when keyed; a signal-based mock (using the REAL GitHub/site data) otherwise.

import { callGemini } from '@/lib/gemini-client';
import { geminiLive } from '@/lib/mock';
import { fetchGitHubEvidence, gitHubSignals, type GitHubEvidence } from './github';
import { fetchSiteEvidence, type SiteEvidence } from './web';
import {
  VerifiedAssessmentSchema,
  SafeToReferBriefSchema,
  type VerifiedAssessment,
  type SafeToReferBrief,
  type CandidateInput,
} from './schema';

export interface VerifyResult {
  assessment: VerifiedAssessment;
  brief: SafeToReferBrief | null;
  github: GitHubEvidence;
  site: SiteEvidence;
  oneQuestion: string; // adaptive ≤60s question the candidate can optionally answer
  isMock: boolean;
}

const SYSTEM = `You are a rigorous, skeptical technical hiring evaluator. Assess a
candidate's competence ONLY from the evidence provided — never invent credentials,
be explicit about gaps. Prefer objective, passive evidence (GitHub, portfolio,
published work) over self-reported claims. Also produce ONE short, role-specific
question the candidate could answer in under 60 seconds to raise confidence (make
it specific to their evidence, not generic). If a live answer is provided, weigh it
as a real signal. When a job description is given, produce a "safe to refer" brief:
whether an employee vouching would protect or risk their reputation, with concrete
proof. Respond with STRICT JSON only.`;

function extractJson(raw: string): any {
  let s = raw.trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

export async function verifyCandidate(
  input: CandidateInput,
  jdText?: string,
): Promise<VerifyResult> {
  const [github, site] = await Promise.all([
    input.githubUsername
      ? fetchGitHubEvidence(input.githubUsername)
      : Promise.resolve({ found: false } as GitHubEvidence),
    input.portfolioUrl
      ? fetchSiteEvidence(input.portfolioUrl)
      : Promise.resolve({ found: false } as SiteEvidence),
  ]);

  if (!geminiLive()) {
    return { ...mockResult(input, github, site, jdText), isMock: true };
  }

  const prompt = `Candidate: ${input.name || '(unnamed)'} — target role: ${input.targetRole || '(see JD)'}

GitHub evidence: ${
    github.found
      ? `${gitHubSignals(github).join('; ')}. Top repos: ${(github.topRepos || [])
          .map((r) => `${r.name} (${r.stars}★, ${r.language || 'n/a'})`)
          .join(', ')}`
      : '(none / not found)'
  }
Portfolio (${site.url || 'none'}): ${
    site.found ? `${site.title || ''} — ${site.description || ''}. ${(site.text || '').slice(0, 1200)}` : '(none)'
  }
Stated highlights: ${input.highlights || '(none)'}
Résumé: ${input.resumeText ? input.resumeText.slice(0, 2500) : '(none)'}
${input.liveAnswer ? `\nCandidate's 60-second answer (live signal): ${input.liveAnswer.slice(0, 1500)}` : ''}
${jdText ? `\nJob description to evaluate against:\n${jdText.slice(0, 2500)}` : ''}

Return STRICT JSON with exactly this shape (no comments, no trailing text):
{"assessment":{"competenceScore":87,"summary":"","strengths":[],"gaps":[],"verifiedSignals":[],"evidence":[{"source":"github","detail":""}]},
"oneQuestion":"one specific ≤60s question tied to their evidence",
"brief":${jdText ? '{"matchScore":87,"verdict":"strong","headline":"","reasons":[],"watchouts":[],"proofPoints":[]}' : 'null'}}

Constraints: competenceScore${jdText ? ' and matchScore are' : ' is an'} integer${jdText ? 's' : ''} 0-100. evidence[].source is one of: github, portfolio, resume, highlight, linkedin.${jdText ? ' brief.verdict is one of: strong, moderate, weak.' : ' Set brief to null.'}`;

  try {
    const raw = await callGemini(SYSTEM, prompt);
    const parsed = extractJson(raw);
    const assessment = VerifiedAssessmentSchema.parse(parsed.assessment ?? {});
    const brief = jdText && parsed.brief ? SafeToReferBriefSchema.parse(parsed.brief) : null;
    const oneQuestion = String(parsed.oneQuestion ?? '').trim() || defaultQuestion(input);
    return { assessment, brief, github, site, oneQuestion, isMock: false };
  } catch {
    return { ...mockResult(input, github, site, jdText), isMock: true };
  }
}

function defaultQuestion(input: CandidateInput): string {
  const role = input.targetRole || 'this role';
  return `In ~60 seconds: what's the hardest problem you solved that's relevant to ${role}, and what exactly was your contribution?`;
}

// ---------------------------------------------------------------------------
// Mock (signal-based) — uses the REAL GitHub/site data so it stays credible.
// ---------------------------------------------------------------------------
function mockResult(
  input: CandidateInput,
  github: GitHubEvidence,
  site: SiteEvidence,
  jdText?: string,
): Omit<VerifyResult, 'isMock'> {
  const stars = github.totalStars || 0;
  const repos = github.publicRepos || 0;
  const base = github.found ? 62 : site.found ? 56 : 48;
  let score = Math.round(base + Math.log10(stars + 1) * 12 + Math.min(repos, 20) * 0.6);
  if (site.found) score += 4;
  if (input.liveAnswer && input.liveAnswer.trim().length > 40) score += 6;
  score = Math.min(97, score);

  const signals = gitHubSignals(github);
  if (site.found) signals.push(`Portfolio: ${site.title || site.url}`);
  const langs = github.topLanguages || [];

  const assessment: VerifiedAssessment = {
    competenceScore: score,
    summary: github.found || site.found
      ? `Evidence-backed: ${signals[0] || 'public work'}${langs.length ? `, strongest in ${langs.slice(0, 2).join(' & ')}` : ''}. (Add GEMINI_API_KEY for the full AI read.)`
      : `Assessed from stated highlights only — link a GitHub or portfolio for verifiable signal.`,
    strengths: [
      ...(langs.length ? [`Hands-on with ${langs.slice(0, 3).join(', ')}`] : []),
      ...(stars > 20 ? ['Work has real traction (community stars)'] : []),
      ...(site.found ? ['Public portfolio of work'] : []),
      ...(input.liveAnswer ? ['Answered the live competence question'] : []),
    ].slice(0, 4),
    gaps: [
      ...(github.found || site.found ? [] : ['No verifiable artifact linked yet']),
      ...(input.liveAnswer ? [] : ['Optional 60-sec answer not provided (would raise confidence)']),
    ],
    verifiedSignals: signals,
    evidence: [
      ...(github.found
        ? (github.topRepos || []).map((r) => ({
            source: 'github' as const,
            detail: `${r.name}: ${r.stars}★${r.language ? `, ${r.language}` : ''}`,
          }))
        : []),
      ...(site.found ? [{ source: 'portfolio' as const, detail: `${site.title || site.url}` }] : []),
      ...(input.highlights ? [{ source: 'highlight' as const, detail: input.highlights.slice(0, 160) }] : []),
    ].slice(0, 6),
  };

  const brief: SafeToReferBrief | null = jdText
    ? {
        matchScore: Math.max(40, score - 8),
        verdict: score >= 78 ? 'strong' : score >= 60 ? 'moderate' : 'weak',
        headline: score >= 78 ? 'Safe to refer — strong evidence of fit' : 'Refer with a light check — moderate fit',
        reasons: [
          ...(signals.length ? [signals[0]] : []),
          ...(langs.length ? [`Relevant stack: ${langs.slice(0, 3).join(', ')}`] : []),
          ...(input.liveAnswer ? ['Backed a live 60-sec competence answer'] : []),
        ].slice(0, 3),
        watchouts: score >= 78 ? [] : ['Confirm depth on the JD’s core requirement in a quick chat'],
        proofPoints: (github.topRepos || []).slice(0, 3).map((r) => `${r.name} (${r.stars}★)`),
      }
    : null;

  return { assessment, brief, github, site, oneQuestion: defaultQuestion(input) };
}
