// API Route: Send a one-off email via Gmail.
import { NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { enforceLimit, recordUsage } from '@/lib/usage';
import { saveEmail } from '@/lib/db/emails';
import { sendGmail, gmailConfigured } from '@/lib/email/gmail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getAppUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const limit = await enforceLimit(user, 'send');
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.message, code: 'limit_reached' },
        { status: 402 },
      );
    }

    const body = await request.json();
    const { to, subject, emailBody, jobId } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, emailBody' },
        { status: 400 },
      );
    }

    if (!gmailConfigured()) {
      return NextResponse.json(
        {
          error:
            'Gmail not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN.',
        },
        { status: 500 },
      );
    }

    const result = await sendGmail({ to, subject, body: emailBody });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 },
      );
    }

    await saveEmail(user, {
      subject,
      body: emailBody,
      status: 'sent',
      thread_id: result.threadId,
      contact_email: to,
      job_external_id: jobId,
      sent_at: new Date().toISOString(),
    });
    await recordUsage(user, 'send');

    return NextResponse.json({
      success: true,
      threadId: result.threadId,
      messageId: result.messageId,
    });
  } catch (error: unknown) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 },
    );
  }
}
