// Real Gemini API client using REST API

import { logError } from './logger';

/**
 * Call Gemini API via REST endpoint
 * Returns raw text output (caller is responsible for JSON parsing if needed)
 */
export async function callGemini(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  // Use v1 API - model names should NOT include "models/" prefix
  // Include system prompt in the first message since v1 doesn't support systemInstruction
  // Remove "models/" prefix if present
  const modelName = model.replace(/^models\//, '');
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${systemPrompt}\n\n${userPrompt}`,
          },
        ],
      },
    ],
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
      const errorMessage = `Gemini API error (${response.status}): ${errorText}`;
      logError('Gemini API call failed:', errorMessage);
      throw new Error(errorMessage);
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
