// Google Sheets writer for persisting contacts, emails, and events

import { google } from 'googleapis';
import { ContactRow, EmailRow, EventRow, JobRow } from './types';
import { logInfo, logWarn, logError } from './logger';
import { ReferralEmailDraft } from './emailDrafts';

let sheetsClient: any = null;

/**
 * Initialize Google Sheets client with write permissions
 */
async function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    const formattedKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    sheetsClient = { sheets, spreadsheetId };
    return sheetsClient;
  } catch (error) {
    logError('Failed to initialize Google Sheets writer:', error);
    return null;
  }
}

/**
 * Append a row to a sheet
 */
async function appendRow(sheetName: string, values: any[]): Promise<boolean> {
  const client = await getSheetsClient();
  if (!client) {
    logWarn('Google Sheets not configured, skipping appendRow');
    return false;
  }

  try {
    const { sheets, spreadsheetId } = client;
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return true;
  } catch (error) {
    logError(`Error appending row to ${sheetName}:`, error);
    return false;
  }
}

/**
 * Update a row in a sheet by matching a key column
 */
async function updateRow(
  sheetName: string,
  keyColumn: string,
  keyValue: string,
  updates: Record<string, any>,
): Promise<boolean> {
  const client = await getSheetsClient();
  if (!client) {
    logWarn('Google Sheets not configured, skipping updateRow');
    return false;
  }

  try {
    const { sheets, spreadsheetId } = client;

    // First, read the sheet to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      logWarn(`No data found in ${sheetName} sheet`);
      return false;
    }

    const headers = rows[0];
    const keyIndex = headers.indexOf(keyColumn);
    if (keyIndex === -1) {
      logWarn(`Key column ${keyColumn} not found in ${sheetName} sheet`);
      return false;
    }

    // Find the row index
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][keyIndex] === keyValue) {
        rowIndex = i + 1; // +1 because Sheets is 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      logWarn(`Row with ${keyColumn}=${keyValue} not found in ${sheetName} sheet`);
      return false;
    }

    // Build update ranges
    const updateData: any[] = [];
    for (const [column, value] of Object.entries(updates)) {
      const colIndex = headers.indexOf(column);
      if (colIndex !== -1) {
        const colLetter = String.fromCharCode(65 + colIndex); // A, B, C, etc.
        updateData.push({
          range: `${sheetName}!${colLetter}${rowIndex}`,
          values: [[value]],
        });
      }
    }

    if (updateData.length === 0) {
      return false;
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updateData,
      },
    });

    return true;
  } catch (error) {
    logError(`Error updating row in ${sheetName}:`, error);
    return false;
  }
}

/**
 * Persist a contact to the contacts sheet
 * @param contact - The contact to persist
 * @param job - Optional job context to get company and domain (if not provided, will use empty strings)
 */
export async function persistContactToSheets(
  contact: ContactRow,
  job?: JobRow,
): Promise<boolean> {
  // Get company and domain from job context if available
  const company = job?.company || '';
  const domain = job?.domain || '';

  const values = [
    contact.contact_id,
    contact.job_id,
    contact.full_name,
    contact.email,
    contact.title,
    company,
    domain,
    contact.linkedin_url || '',
    contact.source,
    contact.verified_status,
    contact.score.toString(),
    contact.signals_json,
    contact.status,
    contact.last_contacted_at || '',
    contact.followup_stage.toString(),
    contact.created_at,
  ];

  const success = await appendRow('contacts', values);
  if (success) {
    logInfo(`Persisted contact ${contact.contact_id} to Sheets`);
  }
  return success;
}

/**
 * Persist an email to the emails sheet
 */
export async function persistEmailToSheets(
  draft: ReferralEmailDraft,
  emailResult: { subject_a: string; subject_b: string },
  sentResult?: { threadId?: string; messageId?: string; success: boolean; error?: string },
): Promise<boolean> {
  const values = [
    draft.email_id,
    draft.contact_id,
    draft.job_id,
    draft.variant_id,
    emailResult.subject_a,
    emailResult.subject_b,
    draft.subject, // subject_used
    draft.body,
    '', // proof_point (can be added later)
    draft.attachments.join(','),
    'false', // approved
    '', // scheduled_at
    sentResult?.success ? new Date().toISOString() : '', // sent_at
    sentResult?.threadId || '', // thread_id
    sentResult?.success ? 'sent' : sentResult?.error ? 'failed' : 'draft', // status
    sentResult?.error || '', // last_error
  ];

  const success = await appendRow('emails', values);
  if (success) {
    logInfo(`Persisted email ${draft.email_id} to Sheets`);
  }
  return success;
}

/**
 * Update email status in Sheets (e.g., after sending)
 */
export async function updateEmailStatusInSheets(
  emailId: string,
  updates: {
    sent_at?: string;
    thread_id?: string;
    status?: string;
    last_error?: string;
  },
): Promise<boolean> {
  return updateRow('emails', 'email_id', emailId, updates);
}

/**
 * Persist an event to the events sheet
 */
export async function persistEventToSheets(event: EventRow): Promise<boolean> {
  const values = [
    event.event_id,
    event.contact_id || '',
    event.job_id,
    event.type,
    event.timestamp,
    event.payload_json, // Already a string from createEventRow, no need to stringify again
    event.notes || '',
  ];

  const success = await appendRow('events', values);
  if (success) {
    logInfo(`Persisted event ${event.event_id} to Sheets`);
  }
  return success;
}

/**
 * Batch persist multiple contacts
 * @param contacts - Array of contacts to persist
 * @param job - Optional job context to get company and domain for all contacts
 */
export async function persistContactsBatch(
  contacts: ContactRow[],
  job?: JobRow,
): Promise<number> {
  let successCount = 0;
  for (const contact of contacts) {
    if (await persistContactToSheets(contact, job)) {
      successCount++;
    }
  }
  return successCount;
}

/**
 * Batch persist multiple emails
 */
export async function persistEmailsBatch(
  drafts: Array<{
    draft: ReferralEmailDraft;
    emailResult: { subject_a: string; subject_b: string };
    sentResult?: { threadId?: string; messageId?: string; success: boolean; error?: string };
  }>,
): Promise<number> {
  let successCount = 0;
  for (const { draft, emailResult, sentResult } of drafts) {
    if (await persistEmailToSheets(draft, emailResult, sentResult)) {
      successCount++;
    }
  }
  return successCount;
}

/**
 * Batch persist multiple events
 */
export async function persistEventsBatch(events: EventRow[]): Promise<number> {
  let successCount = 0;
  for (const event of events) {
    if (await persistEventToSheets(event)) {
      successCount++;
    }
  }
  return successCount;
}

