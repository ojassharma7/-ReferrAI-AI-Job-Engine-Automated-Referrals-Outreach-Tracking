// The verified-referral engine's data contracts.
//
// VerifiedAssessment = the AI's evidence-backed read on a candidate's competence
// (built from REAL signals: GitHub, portfolio, stated highlights).
// SafeToReferBrief = the one-screen output an employee/recruiter sees before
// putting their name on the line — the thing no competitor has.

import { z } from 'zod';

export const EvidenceSchema = z.object({
  source: z.enum(['github', 'portfolio', 'resume', 'highlight', 'linkedin']).default('highlight'),
  detail: z.string().default(''),
});

export const VerifiedAssessmentSchema = z.object({
  competenceScore: z.number().min(0).max(100).default(0),
  summary: z.string().default(''),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  // Concrete, checkable signals ("1.2k GitHub stars across 3 ML repos", "shipped X").
  verifiedSignals: z.array(z.string()).default([]),
  evidence: z.array(EvidenceSchema).default([]),
});

export const SafeToReferBriefSchema = z.object({
  matchScore: z.number().min(0).max(100).default(0),
  verdict: z.enum(['strong', 'moderate', 'weak']).default('moderate'),
  headline: z.string().default(''), // "Safe to refer — 92% match to the JD"
  // Why the referrer's reputation is protected if they vouch.
  reasons: z.array(z.string()).default([]),
  watchouts: z.array(z.string()).default([]),
  proofPoints: z.array(z.string()).default([]),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type VerifiedAssessment = z.infer<typeof VerifiedAssessmentSchema>;
export type SafeToReferBrief = z.infer<typeof SafeToReferBriefSchema>;

// Raw candidate inputs the engine assesses.
export interface CandidateInput {
  name?: string;
  targetRole?: string;
  githubUsername?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  highlights?: string; // freeform: achievements, impact, experience
  resumeText?: string;
}
