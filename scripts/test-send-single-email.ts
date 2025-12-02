#!/usr/bin/env tsx
// Test script to send a single email to yourself

import { loadEnv } from '../src/env';
import { sendEmailViaGmail } from '../src/gmailClient';
import { logInfo, logError, logWarn } from '../src/logger';

loadEnv();

async function testSendSingleEmail() {
  logInfo('🧪 Testing Single Email Send...');
  logInfo('='.repeat(60));

  const fromEmail = process.env.GMAIL_FROM_EMAIL;
  const sendEmails = process.env.SEND_EMAILS === 'true' || process.env.SEND_EMAILS === '1';

  if (!fromEmail) {
    logError('❌ GMAIL_FROM_EMAIL is not set in .env');
    process.exit(1);
  }

  logInfo(`\n📧 From: ${fromEmail}`);
  logInfo(`📧 To: ${fromEmail} (sending to yourself)`);
  logInfo(`📧 SEND_EMAILS: ${sendEmails ? '✅ TRUE (will send real email!)' : '❌ FALSE (dry run)'}`);

  if (!sendEmails) {
    logWarn('\n⚠️  SEND_EMAILS is false. This is a dry run.');
    logWarn('   Set SEND_EMAILS=true in .env to send a real email.');
    logWarn('   Exiting without sending...');
    process.exit(0);
  }

  logInfo('\n📝 Email Details:');
  const subject = 'ReferrAI Test Email - ' + new Date().toISOString();
  const body = `Hello!

This is a test email from ReferrAI.

If you're reading this, the Gmail API integration is working correctly! 🎉

Timestamp: ${new Date().toISOString()}

Best regards,
ReferrAI System`;

  logInfo(`   Subject: ${subject}`);
  logInfo(`   Body: ${body.substring(0, 100)}...`);

  logInfo('\n🚀 Sending email...');
  try {
    const result = await sendEmailViaGmail(fromEmail, subject, body, []);

    if (result.success) {
      logInfo('\n✅ Email sent successfully!');
      logInfo(`   Thread ID: ${result.threadId}`);
      logInfo(`   Message ID: ${result.messageId}`);
      logInfo('\n💡 Check your inbox (and spam folder) for the test email.');
    } else {
      logError('\n❌ Failed to send email');
      logError(`   Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error: any) {
    logError('\n❌ Error sending email:');
    logError(`   ${error.message || error}`);
    process.exit(1);
  }
}

testSendSingleEmail().catch((err) => {
  logError('Unexpected error:', err);
  process.exit(1);
});

