// Real Gemini API client using REST API

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

