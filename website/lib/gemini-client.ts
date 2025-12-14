// Gemini API client for website

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

export interface GeminiResponse {
  text: string;
  error?: string;
}

/**
 * Call Gemini API via REST endpoint
 */
export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: userPrompt,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: systemPrompt,
        },
      ],
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();

    // Extract text from Gemini response
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Unexpected Gemini API response structure');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Gemini API call failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate resume customization based on job description
 */
export async function generateResume(
  baseResume: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  keywords: string[] = [],
): Promise<string> {
  const systemPrompt = `You are an expert resume editor. Keep the candidate's experience authentic; never fabricate roles, employers, or achievements. Adapt content to the job description, reordering or rephrasing bullets to emphasize the most relevant work. Output a full resume text that highlights relevant experience.`;

  const userPrompt = `Base resume content:
${baseResume}

Job details:
- Company: ${company}
- Title: ${jobTitle}
- Job Description: ${jobDescription}
${keywords.length > 0 ? `- Keywords: ${keywords.join(', ')}` : ''}

Instructions:
- Customize the resume to match the job requirements
- Keep total length to 1–2 pages
- Preserve true experience; only rephrase, reorder, or emphasize existing points
- Highlight relevant skills and achievements
- Use professional formatting

Return the customized resume text:`;

  return await callGemini(systemPrompt, userPrompt);
}

/**
 * Generate cover letter based on job and candidate profile
 */
export async function generateCoverLetter(
  candidateProfile: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  contactName?: string,
): Promise<string> {
  const systemPrompt = `You are an expert cover letter writer. Write professional, concise cover letters that highlight the candidate's relevant experience and enthusiasm for the role.`;

  const userPrompt = `Candidate profile:
${candidateProfile}

Job details:
- Company: ${company}
- Title: ${jobTitle}
- Job Description: ${jobDescription}
${contactName ? `- Contact: ${contactName}` : ''}

Instructions:
- Write a professional cover letter (3-4 paragraphs)
- Highlight relevant experience from the candidate profile
- Show enthusiasm for the role and company
- Include specific examples that match the job requirements
- Professional but personable tone
- End with a call to action

Return the cover letter text:`;

  return await callGemini(systemPrompt, userPrompt);
}

/**
 * Generate referral email
 */
export async function generateReferralEmail(
  candidateProfile: string,
  jobTitle: string,
  company: string,
  contactName: string,
  contactTitle: string,
  proofPoint?: string,
): Promise<{ subject_a: string; subject_b: string; body: string }> {
  const systemPrompt = `You are a professional requesting referrals. Write concise, respectful outreach emails that sound human. Always respond ONLY with valid JSON in the form {"subject_a":"","subject_b":"","body":""}. Do not add explanations or extra keys. Emails must be truthful and aligned with the provided profile and job.`;

  const userPrompt = `Candidate profile:
${candidateProfile}

Job details:
- Company: ${company}
- Title: ${jobTitle}

Contact:
- Name: ${contactName}
- Title: ${contactTitle}
${proofPoint ? `\nProof point (must appear in body): ${proofPoint}` : ''}

Constraints:
- 3 to 4 sentences total
- Include exactly one quantified proof point if provided
- Make one specific ask (referral, internal forward, or short call)
- End with a polite opt-out line
- Tone: concise, confident, respectful, sounds like a real person

Return JSON only:
{"subject_a":"","subject_b":"","body":""}`;

  const response = await callGemini(systemPrompt, userPrompt);
  
  // Parse JSON from response
  let jsonStr = response.trim();
  jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  
  const parsed = JSON.parse(jsonStr);
  
  if (!parsed.subject_a || !parsed.subject_b || !parsed.body) {
    throw new Error('Invalid email format from Gemini');
  }
  
  return {
    subject_a: parsed.subject_a,
    subject_b: parsed.subject_b,
    body: parsed.body,
  };
}
