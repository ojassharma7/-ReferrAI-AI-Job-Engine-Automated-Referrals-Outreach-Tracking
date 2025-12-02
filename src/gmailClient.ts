// Gmail API client for sending emails with attachments

import { google } from 'googleapis';
import fs from 'fs';
import { logInfo, logWarn, logError } from './logger';
import { ReferralEmailDraft } from './emailDrafts';

let gmailClient: any = null;

/**
 * Initialize Gmail client with OAuth2 credentials
 */
export async function getGmailClient() {
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
      'urn:ietf:wg:oauth:2.0:oob', // Redirect URI for installed apps
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    gmailClient = gmail;
    return gmailClient;
  } catch (error) {
    logError('Failed to initialize Gmail client:', error);
    return null;
  }
}

/**
 * Encode file to base64 for Gmail attachment
 */
function encodeAttachment(filePath: string): { data: string; filename: string } | null {
  try {
    if (!fs.existsSync(filePath)) {
      logWarn(`Attachment file not found: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath);
    const base64Content = fileContent.toString('base64');
    const filename = filePath.split('/').pop() || 'attachment';

    return {
      data: base64Content,
      filename: filename,
    };
  } catch (error) {
    logError(`Error encoding attachment ${filePath}:`, error);
    return null;
  }
}

/**
 * Create email message with attachments for Gmail API
 */
function createMessage(
  to: string,
  subject: string,
  body: string,
  attachments: Array<{ data: string; filename: string }> = [],
): string {
  const boundary = '----=_Part_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  let rawMessage = `To: ${to}\r\n`;
  rawMessage += `Subject: ${subject}\r\n`;
  rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
  rawMessage += `\r\n--${boundary}\r\n`;
  rawMessage += `Content-Type: text/plain; charset=UTF-8\r\n`;
  rawMessage += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
  rawMessage += `${body}\r\n`;

  // Add attachments
  for (const attachment of attachments) {
    rawMessage += `\r\n--${boundary}\r\n`;
    rawMessage += `Content-Type: application/octet-stream; name="${attachment.filename}"\r\n`;
    rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
    rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    rawMessage += `${attachment.data}\r\n`;
  }

  rawMessage += `\r\n--${boundary}--`;

  // Gmail API requires base64url encoding (RFC 4648 Section 5)
  return Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendEmailResult {
  success: boolean;
  threadId?: string;
  messageId?: string;
  error?: string;
}

/**
 * Send email via Gmail API
 */
export async function sendEmailViaGmail(
  to: string,
  subject: string,
  body: string,
  attachmentPaths: string[] = [],
): Promise<SendEmailResult> {
  const gmail = await getGmailClient();
  if (!gmail) {
    logWarn('Gmail not configured, skipping sendEmailViaGmail');
    return {
      success: false,
      error: 'Gmail not configured',
    };
  }

  try {
    // Encode attachments
    const attachments = attachmentPaths
      .map((path) => encodeAttachment(path))
      .filter((att): att is { data: string; filename: string } => att !== null);

    // Create message
    const rawMessage = createMessage(to, subject, body, attachments);

    // Send via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    const threadId = response.data.threadId || '';
    const messageId = response.data.id || '';

    logInfo(`Email sent successfully to ${to}. Thread ID: ${threadId}`);

    return {
      success: true,
      threadId: threadId,
      messageId: messageId,
    };
  } catch (error: any) {
    logError(`Error sending email to ${to}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Send referral email draft via Gmail
 */
export async function sendReferralEmailDraft(
  draft: ReferralEmailDraft,
  contactEmail: string,
): Promise<SendEmailResult> {
  const result = await sendEmailViaGmail(
    contactEmail,
    draft.subject,
    draft.body,
    draft.attachments,
  );

  return result;
}

