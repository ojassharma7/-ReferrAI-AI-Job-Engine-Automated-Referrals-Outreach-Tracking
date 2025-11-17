// Email prompt building for Gemini referral email generation

import { JobRow, ContactRow, JDInsights } from './types';

export interface ReferralEmailInput {
  candidateProfile: string;
  job: JobRow;
  contact: ContactRow;
  jdInsights: JDInsights;
  proofPoint: string;
}

export interface EmailPrompts {
  systemPrompt: string;
  userPrompt: string;
}

const SYSTEM_PROMPT = `You are Ojas, a data professional requesting referrals. Write concise, respectful outreach emails that sound human. Always respond ONLY with valid JSON in the form {"subject_a":"","subject_b":"","body":""}. Do not add explanations or extra keys. Emails must be truthful and aligned with the provided profile and job.`;

/**
 * Build system and user prompts for Gemini referral email generation
 */
export function buildReferralEmailPrompt(
  input: ReferralEmailInput,
): EmailPrompts {
  const { candidateProfile, job, contact, jdInsights, proofPoint } = input;

  const userPrompt = `Candidate profile:
${candidateProfile}

Job details:
- Company: ${job.company}
- Title: ${job.job_title}
- Location: ${job.job_location}
- Job Family: ${job.job_family}
- URL: ${job.job_url}

JD insights:
- Keywords: ${jdInsights.jd_keywords.join(', ')}
- Top Requirements: ${jdInsights.top_requirements.join('; ')}
- Nice to Have: ${jdInsights.nice_to_have.join('; ')}

Contact:
- Name: ${contact.full_name}
- Title: ${contact.title}
- Seniority: ${contact.seniority}

Proof point (must appear in body verbatim or paraphrased with metric):
${proofPoint}

Constraints:
- 3 to 4 sentences total.
- Include exactly one quantified proof point tied to the job.
- Make one specific ask (referral, internal forward, or short call).
- End with a polite opt-out line.
- Tone: concise, confident, respectful, sounds like a real person.

Return JSON only:
{"subject_a":"","subject_b":"","body":""}`;

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: userPrompt,
  };
}

