// Shared Gmail helper (send + reply detection), used by the send-email route and
// the sequence cron. Single OAuth account via env (GMAIL_CLIENT_ID/SECRET/
// REFRESH_TOKEN) — matches the existing setup. Per-user Gmail OAuth is a future
// multi-tenant step. Everything no-ops gracefully when Gmail isn't configured.

import { google } from 'googleapis';

function real(v: string | undefined): boolean {
  return !!v && v.trim() !== '' && !/your_|your-|_here/i.test(v);
}

export function gmailConfigured(): boolean {
  return (
    real(process.env.GMAIL_CLIENT_ID) &&
    real(process.env.GMAIL_CLIENT_SECRET) &&
    real(process.env.GMAIL_REFRESH_TOKEN)
  );
}

let cached: ReturnType<typeof google.gmail> | null = null;

function getGmail() {
  if (cached) return cached;
  if (!gmailConfigured()) return null;
  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob',
    );
    oauth2.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    cached = google.gmail({ version: 'v1', auth: oauth2 });
    return cached;
  } catch {
    return null;
  }
}

function encodeMessage(to: string, subject: string, body: string): string {
  const raw =
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `Content-Type: text/plain; charset=UTF-8\r\n\r\n` +
    `${body}\r\n`;
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendResult {
  success: boolean;
  threadId?: string;
  messageId?: string;
  error?: string;
}

export async function sendGmail(opts: {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}): Promise<SendResult> {
  const gmail = getGmail();
  if (!gmail) return { success: false, error: 'Gmail not configured' };
  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodeMessage(opts.to, opts.subject, opts.body),
        // Same threadId + matching subject keeps follow-ups in one thread.
        ...(opts.threadId ? { threadId: opts.threadId } : {}),
      },
    });
    return {
      success: true,
      threadId: res.data.threadId ?? undefined,
      messageId: res.data.id ?? undefined,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'send failed' };
  }
}

// Number of messages currently in a Gmail thread. Reply detection compares this
// to how many steps the engine sent: any extra message is an inbound reply.
// (More robust than label-checking — handles self-sends and odd labeling.)
export async function threadMessageCount(threadId: string): Promise<number> {
  const gmail = getGmail();
  if (!gmail || !threadId) return 0;
  try {
    const res = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'minimal',
    });
    return (res.data.messages ?? []).length;
  } catch {
    return 0;
  }
}
