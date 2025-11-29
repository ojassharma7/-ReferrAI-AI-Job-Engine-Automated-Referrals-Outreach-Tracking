#!/usr/bin/env node

// Test script for Google Sheets integration

import { listJobsFromSheets } from './sheetsClient';
import { loadEnv } from './env';
import { logInfo, logWarn } from './logger';

// Load environment variables
loadEnv();

async function main() {
  logInfo('Testing Google Sheets integration...');

  const jobs = await listJobsFromSheets(['ready', 'in_progress']);

  if (jobs.length === 0) {
    logWarn('No jobs found or Google Sheets not configured');
    logWarn('Make sure you have set:');
    logWarn('  - GOOGLE_SHEETS_SPREADSHEET_ID');
    logWarn('  - GOOGLE_SHEETS_CLIENT_EMAIL');
    logWarn('  - GOOGLE_SHEETS_PRIVATE_KEY');
    process.exit(0);
  }

  logInfo(`Found ${jobs.length} jobs with status 'ready' or 'in_progress'`);

  if (jobs.length > 0) {
    const firstJob = jobs[0];
    logInfo('\nFirst job:');
    logInfo(`  job_id: ${firstJob.job_id}`);
    logInfo(`  company: ${firstJob.company}`);
    logInfo(`  job_title: ${firstJob.job_title}`);
    logInfo(`  status: ${firstJob.status}`);
    logInfo(`  domain: ${firstJob.domain}`);
    logInfo(`  jd_text preview: ${firstJob.jd_text.substring(0, 100)}...`);
  }

  logInfo('\n✅ Google Sheets integration test complete');
}

main().catch((err) => {
  logWarn('Error testing Google Sheets:', err);
  process.exit(1);
});

