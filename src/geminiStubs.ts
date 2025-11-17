// Stubbed Gemini API calls (to be replaced with real API integration)

import {
  JobRow,
  JDInsights,
  ResumeCustomizationResponse,
  CoverLetterResponse,
  ReferralEmailResult,
} from './types';

/**
 * Stub: Call Gemini to customize resume based on job description
 */
export function callGeminiResumeCustomization(
  job: JobRow,
  jdInsights: JDInsights,
  baseResume: string,
): ResumeCustomizationResponse {
  // TODO: Replace with real Gemini API call
  return {
    sections: [
      {
        sectionId: 'experience',
        action: 'replace',
        content:
          '\\item Led credit risk modeling initiatives improving loss forecasting by 13%',
        rationale: 'Highlight closest JD match',
      },
    ],
    latexBody: baseResume,
    notes: 'Stubbed response - replace with real Gemini API call',
  };
}

/**
 * Stub: Call Gemini to generate cover letter
 */
export function callGeminiCoverLetter(
  job: JobRow,
  jdInsights: JDInsights,
  candidateProfile: string,
  proofPoint: string,
): CoverLetterResponse {
  // TODO: Replace with real Gemini API call
  return {
    cover_letter: `Dear Hiring Team,

I am writing to express my interest in the ${job.job_title} position at ${job.company}. With a background in ${jdInsights.jd_keywords.slice(0, 3).join(', ')}, I am excited about the opportunity to contribute to your team.

${proofPoint} This experience aligns directly with your requirements for ${jdInsights.top_requirements[0] || 'this role'}.

I would welcome the opportunity to discuss how my skills and experience can benefit ${job.company}.

Best regards,
Ojas`,
    summaryBullets: [proofPoint],
  };
}

/**
 * Stub: Call Gemini to generate referral email
 */
export async function callGeminiReferralEmail(
  prompts: { systemPrompt: string; userPrompt: string },
): Promise<ReferralEmailResult> {
  // TODO: Replace with real Gemini API call
  // For now, extract contact name and job title from userPrompt to make it realistic
  const contactMatch = prompts.userPrompt.match(/Name: ([^\n]+)/);
  const jobTitleMatch = prompts.userPrompt.match(/Title: ([^\n]+)/);
  const contactName = contactMatch ? contactMatch[1].split(' ')[0] : 'there';
  const jobTitle = jobTitleMatch ? jobTitleMatch[1] : 'this role';

  return {
    subject_a: `Quick referral request for ${jobTitle} at ${jobTitleMatch ? prompts.userPrompt.match(/Company: ([^\n]+)/)?.[1] || 'your company' : 'your company'}`,
    subject_b: `${contactName}, quick intro re: ${jobTitle} opening`,
    body: `Hi ${contactName},

I noticed the ${jobTitle} opening and thought you might be able to help. I've been working in credit risk modeling for the past few years, and ${prompts.userPrompt.match(/Proof point[^\n]+\n([^\n]+)/)?.[1] || 'I recently improved loss forecasting by 13%'}.

Would you be open to a quick referral or internal forward? Happy to share more details if helpful.

If this isn't the right fit, no worries at all—thanks for your time either way.

Best,
Ojas`,
  };
}

