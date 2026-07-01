// The verification brain: turn real candidate evidence into an honest competence
// assessment and a "safe-to-refer" brief. Uses Gemini when keyed; a signal-based
// mock otherwise (still uses the REAL GitHub numbers so the demo looks credible).

import { callGemini } from '@/lib/gemini-client';
import { geminiLive } from '@/lib/mock';
import { fetchGitHubEvidence, gitHubSignals, type GitHubEvidence } from './github';
import {
  VerifiedAssessmentSchema,
  SafeToReferBriefSchema,
  type VerifiedAssessment,
  type SafeToReferBrief,
  type CandidateInput,
} from './schema';

export interface VerifyResult {
  assessment: VerifiedAssessment;
  brief: SafeToReferBrief | null; // present when a JD / target role is provided
  github: GitHubEvidence;
  isMock: boolean;
}

const SYSTEM = `You are a rigorous, skeptical technical hiring evaluator. Assess a
candidate's competence ONLY from the evidence provided — never invent credentials,
and be explicit about gaps and unknowns. When a job description is provided, also
produce a "safe to refer" brief: whether an employee vouching for this candidate
would be protecting or risking their own reputation, with the concrete proof that
de-risks it. Respond with STRICT JSON only, no prose.`;

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
  const github = input.githubUsername
    ? await fetchGitHubEvidence(input.githubUsername)
    : { found: false };

  if (!geminiLive()) {
    return { ...mockResult(input, github, jdText), isMock: true };
  }

  const prompt = `Candidate: ${input.name || '(unnamed)'} — target role: ${input.targetRole || jdText ? input.targetRole || 'see JD' : '(none)'}

GitHub evidence: ${
    github.found
      ? `${gitHubSignals(github).join('; ')}. Top repos: ${(github.topRepos || [])
          .map((r) => `${r.name} (${r.stars}★, ${r.language || 'n/a'})`)
          .join(', ')}`
      : '(none provided or not found)'
  }
Portfolio: ${input.portfolioUrl || '(none)'}
Stated highlights: ${input.highlights || '(none)'}
Resume: ${input.resumeText ? input.resumeText.slice(0, 3000) : '(none)'}
${jdText ? `\nJob description to evaluate against:\n${jdText.slice(0, 3000)}` : ''}

Return JSON exactly:
{"assessment":{"competenceScore":0-100,"summary":"","strengths":[],"gaps":[],"verifiedSignals":[],"evidence":[{"source":"github|portfolio|resume|highlight|linkedin","detail":""}]},
"brief": ${jdText ? '{"matchScore":0-100,"verdict":"strong|moderate|weak","headline":"","reasons":[],"watchouts":[],"proofPoints":[]}' : 'null'}}`;

  try {
    const raw = await callGemini(SYSTEM, prompt);
    const parsed = extractJson(raw);
    const assessment = VerifiedAssessmentSchema.parse(parsed.assessment ?? {});
    const brief =
      jdText && parsed.brief ? SafeToReferBriefSchema.parse(parsed.brief) : null;
    return { assessment, brief, github, isMock: false };
  } catch {
    return { ...mockResult(input, github, jdText), isMock: true };
  }
}

// ---------------------------------------------------------------------------
// Mock (signal-based) — uses the real GitHub numbers so it still looks credible.
// ---------------------------------------------------------------------------
function mockResult(
  input: CandidateInput,
  github: GitHubEvidence,
  jdText?: string,
): Omit<VerifyResult, 'isMock'> {
  const stars = github.totalStars || 0;
  const repos = github.publicRepos || 0;
  const base = github.found ? 62 : 48;
  const score = Math.min(
    96,
    Math.round(base + Math.log10(stars + 1) * 12 + Math.min(repos, 20) * 0.6),
  );
  const signals = gitHubSignals(github);
  const langs = github.topLanguages || [];

  const assessment: VerifiedAssessment = {
    competenceScore: score,
    summary: github.found
      ? `Active builder — ${signals[0] || 'public GitHub activity'}${
          langs.length ? `, strongest in ${langs.slice(0, 2).join(' & ')}` : ''
        }. Assessment is evidence-based (add GEMINI_API_KEY for a deeper AI read).`
      : `Profile assessed from stated highlights only — link a GitHub for verifiable signals.`,
    strengths: [
      ...(langs.length ? [`Hands-on with ${langs.slice(0, 3).join(', ')}`] : []),
      ...(stars > 20 ? ['Work has traction (community stars)'] : []),
      ...(input.highlights ? ['Concrete self-reported impact'] : []),
    ].slice(0, 4),
    gaps: [
      ...(github.found ? [] : ['No verifiable code signal yet (no GitHub linked)']),
      'Deeper skill verification pending (AI interview / work sample)',
    ],
    verifiedSignals: signals,
    evidence: [
      ...(github.found
        ? (github.topRepos || []).map((r) => ({
            source: 'github' as const,
            detail: `${r.name}: ${r.stars}★${r.language ? `, ${r.language}` : ''}`,
          }))
        : []),
      ...(input.highlights ? [{ source: 'highlight' as const, detail: input.highlights.slice(0, 160) }] : []),
    ].slice(0, 6),
  };

  const brief: SafeToReferBrief | null = jdText
    ? {
        matchScore: Math.max(40, score - 8),
        verdict: score >= 78 ? 'strong' : score >= 60 ? 'moderate' : 'weak',
        headline:
          score >= 78
            ? `Safe to refer — strong evidence of fit`
            : `Refer with a light check — moderate fit`,
        reasons: [
          ...(signals.length ? [signals[0]] : []),
          ...(langs.length ? [`Relevant stack: ${langs.slice(0, 3).join(', ')}`] : []),
        ].slice(0, 3),
        watchouts: score >= 78 ? [] : ['Confirm depth on the JD’s core requirement in a quick chat'],
        proofPoints: (github.topRepos || []).slice(0, 3).map((r) => `${r.name} (${r.stars}★)`),
      }
    : null;

  return { assessment, brief, github };
}
