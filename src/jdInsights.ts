// JD (Job Description) insights extraction utilities

import { JobRow, JDInsights } from './types';

/**
 * Extract keywords from text using frequency analysis
 */
export function getKeywords(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length > 3 && w.length < 25);
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

/**
 * Extract phrases matching a regex pattern
 */
export function extractPhrases(text: string, pattern: string): string[] {
  const matches: string[] = [];
  const regex = new RegExp(pattern, 'gi');
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

/**
 * Extract structured insights from a job description
 */
export function extractJdInsights(job: JobRow): JDInsights {
  const jdText = job.jd_text || '';

  const keywordList = getKeywords(jdText);

  const requirements = extractPhrases(
    jdText,
    /(?:responsibilities|requirements|must have|you will|you should):?\s*([\s\S]*?)(?:\n\n|$)/,
  );
  const niceToHave = extractPhrases(
    jdText,
    /(?:nice to have|preferred|bonus):?\s*([\s\S]*?)(?:\n\n|$)/,
  );

  return {
    jd_keywords: keywordList.slice(0, 10),
    top_requirements: requirements.length
      ? requirements[0]
          .split(/\n|•|-/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 5)
      : [],
    nice_to_have: niceToHave.length
      ? niceToHave[0]
          .split(/\n|•|-/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 5)
      : [],
  };
}

