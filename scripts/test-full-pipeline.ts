#!/usr/bin/env tsx
// Comprehensive test script for the full pipeline (dry run)

import { loadEnv } from '../src/env';
import { runJobPipeline } from '../src/jobPipeline';
import { logInfo, logError, logWarn } from '../src/logger';

loadEnv();

async function testFullPipeline() {
  logInfo('🧪 Testing Full Pipeline (Dry Run)...');
  logInfo('='.repeat(60));

  const sendEmails = process.env.SEND_EMAILS === 'true' || process.env.SEND_EMAILS === '1';
  const jobId = process.argv[2] || 'test-pipeline-001';

  logInfo(`\n📋 Configuration:`);
  logInfo(`   Job ID: ${jobId}`);
  logInfo(`   SEND_EMAILS: ${sendEmails ? '✅ TRUE (will send real emails!)' : '❌ FALSE (dry run)'}`);
  logInfo(`   USE_GEMINI: ${process.env.USE_GEMINI === 'true' ? '✅ TRUE' : '❌ FALSE (using stubs)'}`);
  logInfo(`   HUNTER_API_KEY: ${process.env.HUNTER_API_KEY ? '✅ Set' : '❌ Not set (using stubs)'}`);
  logInfo(`   GOOGLE_SHEETS: ${process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '✅ Configured' : '❌ Not configured (using stubs)'}`);

  if (sendEmails) {
    logWarn('\n⚠️  WARNING: SEND_EMAILS is TRUE!');
    logWarn('   This will send REAL emails to discovered contacts!');
    logWarn('   Press Ctrl+C within 5 seconds to cancel...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    logInfo('\n✅ Proceeding with email sending enabled...');
  } else {
    logInfo('\n✅ Running in DRY RUN mode (no emails will be sent)');
  }

  logInfo('\n🚀 Starting pipeline...');
  logInfo('='.repeat(60));

  try {
    await runJobPipeline(jobId);
    
    logInfo('\n' + '='.repeat(60));
    logInfo('✅ Pipeline test completed successfully!');
    
    if (!sendEmails) {
      logInfo('\n💡 Next steps:');
      logInfo('   1. Review the generated files (resume, cover letter)');
      logInfo('   2. Check Google Sheets for persisted data');
      logInfo('   3. When ready, set SEND_EMAILS=true to send real emails');
    } else {
      logInfo('\n💡 Emails have been sent!');
      logInfo('   1. Check your Gmail sent folder');
      logInfo('   2. Check Google Sheets for email status');
      logInfo('   3. Monitor for replies');
    }
  } catch (error: any) {
    logError('\n❌ Pipeline test failed:');
    logError(`   ${error.message || error}`);
    if (error.stack) {
      logError(`\nStack trace:\n${error.stack}`);
    }
    process.exit(1);
  }
}

testFullPipeline().catch((err) => {
  logError('Unexpected error:', err);
  process.exit(1);
});

