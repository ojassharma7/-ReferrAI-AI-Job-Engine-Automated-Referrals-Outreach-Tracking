#!/usr/bin/env tsx
// Script to create required tabs in Google Sheets

import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import { logInfo, logError } from '../src/logger';

async function createSheetsTabs() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    logError('Google Sheets credentials not configured');
    process.exit(1);
  }

  try {
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Define tabs and their headers
    const tabs = [
      {
        title: 'contacts',
        headers: [
          'contact_id',
          'job_id',
          'full_name',
          'email',
          'title',
          'company',
          'domain',
          'linkedin_url',
          'source',
          'verified_status',
          'score',
          'signals_json',
          'status',
          'last_contacted_at',
          'followup_stage',
          'created_at',
        ],
      },
      {
        title: 'emails',
        headers: [
          'email_id',
          'contact_id',
          'job_id',
          'variant_id',
          'subject_a',
          'subject_b',
          'subject_used',
          'body',
          'proof_point',
          'attachments',
          'approved',
          'scheduled_at',
          'sent_at',
          'thread_id',
          'status',
          'last_error',
        ],
      },
      {
        title: 'events',
        headers: [
          'event_id',
          'contact_id',
          'job_id',
          'type',
          'timestamp',
          'payload_json',
          'notes',
        ],
      },
    ];

    logInfo('Creating tabs in Google Sheet...');

    for (const tab of tabs) {
      try {
        // Check if tab exists
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId,
        });

        const existingTabs = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
        
        if (existingTabs.includes(tab.title)) {
          logInfo(`✅ Tab "${tab.title}" already exists`);
          continue;
        }

        // Create new tab
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: tab.title,
                  },
                },
              },
            ],
          },
        });

        logInfo(`✅ Created tab "${tab.title}"`);

        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${tab.title}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [tab.headers],
          },
        });

        logInfo(`✅ Added headers to "${tab.title}"`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          logInfo(`✅ Tab "${tab.title}" already exists`);
        } else {
          logError(`Error creating tab "${tab.title}":`, error);
        }
      }
    }

    logInfo('\n🎉 All tabs created successfully!');
    logInfo('\nYou can now run the persistence test:');
    logInfo('  npx tsx scripts/test-sheets-persistence.ts');
  } catch (error) {
    logError('Error creating tabs:', error);
    process.exit(1);
  }
}

createSheetsTabs();

