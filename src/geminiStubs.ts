// Gemini API calls with real integration and stubs as fallback

import {
  JobRow,
  JDInsights,
  ResumeCustomizationResponse,
  CoverLetterResponse,
  ReferralEmailResult,
} from './types';
import { callGemini } from './geminiClient';
import { logInfo, logWarn } from './logger';

/**
 * Call Gemini to customize resume based on job description
 * Uses real API if USE_GEMINI=true, otherwise returns stub
 */
export async function callGeminiResumeCustomization(
  job: JobRow,
  jdInsights: JDInsights,
  baseResume: string,
): Promise<ResumeCustomizationResponse> {
  const useRealGemini = process.env.USE_GEMINI === 'true';
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001'; // Stable version

  if (useRealGemini) {
    logInfo('Calling real Gemini API for resume customization...');
    const systemPrompt = `You are an expert resume editor. Keep the candidate's experience authentic; never fabricate roles, employers, or achievements. Adapt content to the job description, reordering or rephrasing bullets to emphasize the most relevant work. Output either structured updates or a full LaTeX body as instructed.`;
    const userPrompt = `Base resume content (structured or plain text):
${baseResume}

Job details:
- Company: ${job.company}
- Title: ${job.job_title}
- Job Family: ${job.job_family}

JD insights:
- Keywords: ${jdInsights.jd_keywords.join(', ')}
- Top Requirements: ${jdInsights.top_requirements.join('; ')}
- Nice to Have: ${jdInsights.nice_to_have.join('; ')}

Instructions:
- Prefer structured updates: array of objects {sectionId, action (replace|append|reorder), content, rationale}.
- If structured updates are insufficient, provide a full LaTeX resume body.
- Keep total length to 1–2 pages consistent with the base template.
- Preserve true experience; only rephrase, reorder, or emphasize existing points.

Respond with JSON:
{
  "sections": [ ... ],
  "latexBody": "<optional if providing full body>",
  "notes": "<optional guidance>"
}`;

    try {
      const rawResponse = await callGemini(model, systemPrompt, userPrompt);
      logInfo(`Raw Gemini response (first 500 chars): ${rawResponse.substring(0, 500)}`);
      
      // Try to parse JSON from response
      let jsonStr = rawResponse.trim();
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      logInfo(`Extracted JSON string (first 300 chars): ${jsonStr.substring(0, 300)}`);
      
      const parsed = JSON.parse(jsonStr);
      logInfo('Successfully parsed Gemini response');
      return parsed as ResumeCustomizationResponse;
    } catch (error) {
      logWarn('Failed to parse Gemini response, falling back to stub');
      logWarn(`Error details: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        logWarn(`Stack: ${error.stack.substring(0, 200)}`);
      }
      // Fall through to stub
    }
  }

  // Stub fallback
  logInfo('Using stubbed resume customization response');
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
 * Call Gemini to generate cover letter
 * Uses real API if USE_GEMINI=true, otherwise returns stub
 */
export async function callGeminiCoverLetter(
  job: JobRow,
  jdInsights: JDInsights,
  candidateProfile: string,
  proofPoint: string,
): Promise<CoverLetterResponse> {
  const useRealGemini = process.env.USE_GEMINI === 'true';
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001'; // Stable version

  if (useRealGemini) {
    logInfo('Calling real Gemini API for cover letter generation...');
    const systemPrompt = `You are drafting tailored cover letters in LaTeX-friendly text. Use the candidate's authentic background, referencing specific JD responsibilities and linking them to concrete achievements. Output 3–5 short paragraphs separated by blank lines.`;
    const userPrompt = `Candidate profile:
${candidateProfile}

Job details:
- Company: ${job.company}
- Title: ${job.job_title}
- Location: ${job.job_location}
- Job Family: ${job.job_family}

JD insights:
- Keywords: ${jdInsights.jd_keywords.join(', ')}
- Top Requirements: ${jdInsights.top_requirements.join('; ')}
- Nice to Have: ${jdInsights.nice_to_have.join('; ')}

Proof point to highlight:
${proofPoint}

Requirements:
- Reference 1–2 explicit responsibilities from the JD.
- Tie those responsibilities to the provided achievements.
- Keep tone confident, polite, and concise.
- Produce LaTeX-safe text (escape characters where needed).
- Output 3–5 paragraphs separated by blank lines.

Return JSON:
{"cover_letter":"<paragraphs separated by \\n\\n>"}`;

    try {
      const rawResponse = await callGemini(model, systemPrompt, userPrompt);
      logInfo(`Raw Gemini response (first 500 chars): ${rawResponse.substring(0, 500)}`);
      
      // Try to parse JSON from response
      let jsonStr = rawResponse.trim();
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      logInfo(`Extracted JSON string (first 300 chars): ${jsonStr.substring(0, 300)}`);
      
      const parsed = JSON.parse(jsonStr);
      logInfo('Successfully parsed Gemini response');
      return parsed as CoverLetterResponse;
    } catch (error) {
      logWarn('Failed to parse Gemini response, falling back to stub');
      logWarn(`Error details: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        logWarn(`Stack: ${error.stack.substring(0, 200)}`);
      }
      // Fall through to stub
    }
  }

  // Stub fallback
  logInfo('Using stubbed cover letter response');
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
 * Call Gemini to generate referral email
 * Uses real API if USE_GEMINI=true, otherwise returns stub
 */
export async function callGeminiReferralEmail(
  prompts: { systemPrompt: string; userPrompt: string },
): Promise<ReferralEmailResult> {
  const useRealGemini = process.env.USE_GEMINI === 'true';
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001'; // Stable version

  if (useRealGemini) {
    logInfo('Calling real Gemini API for referral email generation...');
    try {
      const rawResponse = await callGemini(
        model,
        prompts.systemPrompt,
        prompts.userPrompt,
      );
      logInfo(`Raw Gemini response (first 500 chars): ${rawResponse.substring(0, 500)}`);
      
      // Try to parse JSON from response
      let jsonStr = rawResponse.trim();
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      logInfo(`Extracted JSON string (first 300 chars): ${jsonStr.substring(0, 300)}`);
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!parsed.subject_a || !parsed.subject_b || !parsed.body) {
        throw new Error('Missing required fields in Gemini response');
      }
      
      logInfo('Successfully parsed Gemini response');
      return parsed as ReferralEmailResult;
    } catch (error) {
      logWarn('Failed to parse Gemini response, falling back to stub');
      logWarn(`Error details: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        logWarn(`Stack: ${error.stack.substring(0, 200)}`);
      }
      // Fall through to stub
    }
  }

  // Stub fallback
  logInfo('Using stubbed referral email response');
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

