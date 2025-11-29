// Google Sheets client for reading jobs and persisting data

import { google } from 'googleapis';
import { JobRow, JobStatus } from './types';
import { logWarn, logError } from './logger';

export interface SheetsJobRowRaw {
  job_id: string;
  company: string;
  company_slug: string;
  domain: string;
  job_title: string;
  job_family: string;
  job_location: string;
  job_url: string;
  jd_text: string;
  jd_keywords?: string;
  status?: string;
  resume_status?: string;
  cover_letter_status?: string;
  notes?: string;
  last_synced_at?: string;
}

let sheetsClient: any = null;

/**
 * Initialize Google Sheets client with service account credentials
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
    // Handle escaped newlines in private key
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
    logError('Failed to initialize Google Sheets client:', error);
    return null;
  }
}

/**
 * Map raw Sheets row to JobRow
 */
function mapSheetsRowToJobRow(row: SheetsJobRowRaw): JobRow {
  return {
    job_id: row.job_id,
    company: row.company,
    company_slug: row.company_slug,
    domain: row.domain,
    job_title: row.job_title,
    job_family: row.job_family,
    job_location: row.job_location || '',
    job_url: row.job_url,
    jd_text: row.jd_text,
    jd_keywords: row.jd_keywords || '',
    resume_status: (row.resume_status as any) || 'pending',
    cover_letter_status: (row.cover_letter_status as any) || 'pending',
    status: (row.status as JobStatus) || 'ready',
    notes: row.notes || '',
    last_synced_at: row.last_synced_at || new Date().toISOString(),
  };
}

/**
 * Get a single job row from Google Sheets by job_id
 */
export async function getJobRowFromSheets(jobId: string): Promise<JobRow | null> {
  const client = await getSheetsClient();
  if (!client) {
    logWarn('Google Sheets not configured, skipping getJobRowFromSheets');
    return null;
  }

  try {
    const { sheets, spreadsheetId } = client;
    const sheetName = 'jobs'; // Assuming sheet is named 'jobs'

    // Read all rows from the jobs sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`, // Adjust range as needed
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return null; // No data rows
    }

    // First row is headers - find job_id column index
    const headers = rows[0];
    const jobIdIndex = headers.indexOf('job_id');
    if (jobIdIndex === -1) {
      logWarn('job_id column not found in jobs sheet');
      return null;
    }

    // Find row with matching job_id
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[jobIdIndex] === jobId) {
        // Map row to object using headers
        const rowObj: any = {};
        headers.forEach((header: string, idx: number) => {
          rowObj[header] = row[idx] || '';
        });

        return mapSheetsRowToJobRow(rowObj as SheetsJobRowRaw);
      }
    }

    return null; // Job not found
  } catch (error) {
    logError('Error reading job from Google Sheets:', error);
    return null;
  }
}

/**
 * List all jobs from Google Sheets, optionally filtered by status
 */
export async function listJobsFromSheets(
  statuses?: JobStatus[],
): Promise<JobRow[]> {
  const client = await getSheetsClient();
  if (!client) {
    logWarn('Google Sheets not configured, skipping listJobsFromSheets');
    return [];
  }

  try {
    const { sheets, spreadsheetId } = client;
    const sheetName = 'jobs';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return [];
    }

    const headers = rows[0];
    const statusIndex = headers.indexOf('status');
    const jobIdIndex = headers.indexOf('job_id');

    if (jobIdIndex === -1) {
      logWarn('job_id column not found in jobs sheet');
      return [];
    }

    const jobs: JobRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[jobIdIndex]) continue; // Skip empty rows

      // Filter by status if provided
      if (statuses && statusIndex !== -1) {
        const rowStatus = row[statusIndex];
        if (!statuses.includes(rowStatus as JobStatus)) {
          continue;
        }
      }

      // Map row to object
      const rowObj: any = {};
      headers.forEach((header: string, idx: number) => {
        rowObj[header] = row[idx] || '';
      });

      jobs.push(mapSheetsRowToJobRow(rowObj as SheetsJobRowRaw));
    }

    return jobs;
  } catch (error) {
    logError('Error listing jobs from Google Sheets:', error);
    return [];
  }
}

