// API Route: Send email via Gmail

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

let gmailClient: any = null;

async function getGmailClient() {
  if (gmailClient) {
    return gmailClient;
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob',
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    gmailClient = gmail;
    return gmailClient;
  } catch (error) {
    console.error('Failed to initialize Gmail client:', error);
    return null;
  }
}

function createMessage(
  to: string,
  subject: string,
  body: string,
): string {
  let rawMessage = `To: ${to}\r\n`;
  rawMessage += `Subject: ${subject}\r\n`;
  rawMessage += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
  rawMessage += `${body}\r\n`;

  return Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, emailBody } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, emailBody' },
        { status: 400 }
      );
    }

    const gmail = await getGmailClient();
    if (!gmail) {
      return NextResponse.json(
        { error: 'Gmail not configured. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN' },
        { status: 500 }
      );
    }

    const rawMessage = createMessage(to, subject, emailBody);

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    return NextResponse.json({
      success: true,
      threadId: response.data.threadId,
      messageId: response.data.id,
    });
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

