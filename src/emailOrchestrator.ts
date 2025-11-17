// Orchestrator for generating referral emails

import { JobRow, ContactRow, JDInsights, ReferralEmailResult } from './types';
import { buildReferralEmailPrompt, ReferralEmailInput } from './emailPrompts';
import { callGeminiReferralEmail } from './geminiStubs';

const DEFAULT_CANDIDATE_PROFILE =
  'Ojas Sharma — data scientist with credit risk background.';
const DEFAULT_PROOF_POINT =
  'Detected 13% more high-risk gamblers via unsupervised clustering.';

/**
 * Generate a referral email for a single contact
 */
export async function generateReferralEmailForContact(
  job: JobRow,
  contact: ContactRow,
  jdInsights: JDInsights,
  candidateProfile?: string,
  proofPoint?: string,
): Promise<ReferralEmailResult & { contact: ContactRow; job: JobRow }> {
  const profile = candidateProfile || DEFAULT_CANDIDATE_PROFILE;
  const proof = proofPoint || DEFAULT_PROOF_POINT;

  const input: ReferralEmailInput = {
    candidateProfile: profile,
    job: job,
    contact: contact,
    jdInsights: jdInsights,
    proofPoint: proof,
  };

  const prompts = buildReferralEmailPrompt(input);
  const emailResult = await callGeminiReferralEmail(prompts);

  return {
    ...emailResult,
    contact: contact,
    job: job,
  };
}

