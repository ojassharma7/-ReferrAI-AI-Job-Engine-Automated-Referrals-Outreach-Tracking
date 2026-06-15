// Draft a polite multi-step outreach sequence: an initial referral ask plus two
// spaced follow-ups. AI-written when Gemini is keyed; otherwise a sensible demo
// draft. The sequence is designed to auto-stop the moment the contact replies.

import { callGemini } from '@/lib/gemini-client';
import { geminiLive } from '@/lib/mock';

export interface SequenceStepDraft {
  step_no: number;
  send_after_days: number;
  subject: string;
  body: string;
}

export interface DraftSequenceInput {
  contactName: string;
  contactTitle?: string;
  company: string;
  jobTitle: string;
  candidateProfile?: string;
  proofPoint?: string;
}

const DELAYS = [0, 3, 7];

const SYSTEM = `You write concise, respectful job-referral outreach that sounds
human — never spammy. You produce a 3-step email sequence: (1) initial ask,
(2) a short nudge after a few days, (3) a final brief follow-up. Each step is
3-5 sentences, makes one clear ask (referral, internal forward, or quick chat),
includes one truthful proof point if provided, and ends with a polite opt-out.
Respond with STRICT JSON only.`;

function buildPrompt(input: DraftSequenceInput): string {
  return `Candidate profile: ${input.candidateProfile || '(not provided)'}
Proof point (use verbatim if provided): ${input.proofPoint || '(none)'}

Contact: ${input.contactName}${input.contactTitle ? `, ${input.contactTitle}` : ''}
Company: ${input.company}
Target role: ${input.jobTitle}

Return JSON: an array of exactly 3 objects, each:
{"step_no": 1, "send_after_days": 0, "subject": "", "body": ""}
Use send_after_days 0, 3, 7 for steps 1, 2, 3. Follow-ups should reference the
previous note briefly and stay short.`;
}

function extractJsonArray(raw: string): unknown {
  let s = raw.trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = s.indexOf('[');
  const end = s.lastIndexOf(']');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

export async function draftSequence(
  input: DraftSequenceInput,
): Promise<{ steps: SequenceStepDraft[]; isMock: boolean }> {
  if (!geminiLive()) return { steps: mockSteps(input), isMock: true };

  try {
    const raw = await callGemini(SYSTEM, buildPrompt(input));
    const parsed = extractJsonArray(raw);
    if (Array.isArray(parsed) && parsed.length >= 1) {
      const steps: SequenceStepDraft[] = parsed.slice(0, 3).map((s: any, i: number) => ({
        step_no: i + 1,
        send_after_days:
          typeof s?.send_after_days === 'number' ? s.send_after_days : DELAYS[i] ?? 0,
        subject: String(s?.subject ?? '').trim() || `Re: ${input.jobTitle} at ${input.company}`,
        body: String(s?.body ?? '').trim(),
      }));
      if (steps.every((s) => s.body)) return { steps, isMock: false };
    }
    return { steps: mockSteps(input), isMock: true };
  } catch {
    return { steps: mockSteps(input), isMock: true };
  }
}

function mockSteps(input: DraftSequenceInput): SequenceStepDraft[] {
  const first = input.contactName.split(' ')[0] || 'there';
  const proof = input.proofPoint
    ? ` ${input.proofPoint}`
    : ' I recently shipped a project that lifted a key metric ~20%.';
  return [
    {
      step_no: 1,
      send_after_days: 0,
      subject: `Quick question about the ${input.jobTitle} role at ${input.company}`,
      body: `Hi ${first},\n\nI'm exploring the ${input.jobTitle} role at ${input.company} and your work caught my eye.${proof} Would you be open to a referral or a quick 10-minute chat? Totally understand if you're busy — no worries either way.\n\nThanks!`,
    },
    {
      step_no: 2,
      send_after_days: 3,
      subject: `Re: ${input.jobTitle} at ${input.company}`,
      body: `Hi ${first},\n\nJust floating my note back to the top in case it slipped by. I'd really value your perspective on the ${input.jobTitle} role, even briefly. No pressure at all if now isn't a good time.\n\nThanks again!`,
    },
    {
      step_no: 3,
      send_after_days: 7,
      subject: `Re: ${input.jobTitle} at ${input.company}`,
      body: `Hi ${first},\n\nLast note from me — I don't want to crowd your inbox. If a referral isn't a fit, I completely understand and appreciate your time. Wishing you the best either way!\n\n(Demo sequence — add GEMINI_API_KEY for AI-personalized follow-ups.)`,
    },
  ];
}
