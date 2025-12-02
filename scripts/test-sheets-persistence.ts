#!/usr/bin/env tsx
// Test script for Google Sheets persistence

import dotenv from 'dotenv';
dotenv.config();

import {
  persistContactToSheets,
  persistEmailToSheets,
  persistEventToSheets,
} from '../src/sheetsWriter';
import { createEventRow } from '../src/sheetsPayload';
import { ContactRow, EmailRow, EventRow, JobRow } from '../src/types';
import { logInfo, logWarn } from '../src/logger';

// Test data
const testJob: JobRow = {
  job_id: 'test-sheets-001',
  company: 'Test Company',
  company_slug: 'test-company',
  domain: 'testcompany.com',
  job_title: 'Data Scientist',
  job_family: 'Data Science',
  job_location: 'San Francisco, CA',
  job_url: 'https://testcompany.com/jobs/data-scientist',
  jd_text: 'Test job description for data scientist role.',
  jd_keywords: 'python, machine learning, data science',
  resume_status: 'pending',
  cover_letter_status: 'pending',
  status: 'ready',
  notes: 'Test job for sheets persistence',
  last_synced_at: new Date().toISOString(),
};

const testContact: ContactRow = {
  contact_id: 'test-contact-001',
  job_id: testJob.job_id,
  company_slug: testJob.company_slug,
  full_name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  title: 'Senior Recruiter',
  seniority: 'senior',
  team_function: 'talent',
  email: 'john.doe@testcompany.com',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  source: 'hunter',
  verified_status: 'valid',
  score: 85,
  signals_json: '{"relevance": "high"}',
  status: 'new',
  last_contacted_at: '',
  followup_stage: 'initial',
  created_at: new Date().toISOString(),
};

const testEmailDraft = {
  email_id: 'test-email-001',
  contact_id: testContact.contact_id,
  job_id: testJob.job_id,
  variant_id: 'variant-a',
  subject: 'Quick referral request for Data Scientist role',
  body: 'Hi John,\n\nI noticed the Data Scientist opening and thought you might be able to help...',
  attachments: ['resume.pdf', 'cover_letter.pdf'],
};

const testEmailResult = {
  subject_a: 'Quick referral request for Data Scientist role',
  subject_b: 'John, quick intro re: Data Scientist opening',
  body: 'Hi John,\n\nI noticed the Data Scientist opening...',
};

async function main() {
  logInfo('🧪 Testing Google Sheets Persistence...');
  logInfo('='.repeat(60));

  // Test 1: Persist Contact
  logInfo('\n1️⃣ Testing Contact Persistence...');
  const contactSuccess = await persistContactToSheets(testContact, testJob);
  if (contactSuccess) {
    logInfo('✅ Contact persisted successfully!');
  } else {
    logWarn('❌ Failed to persist contact');
  }

  // Test 2: Persist Email
  logInfo('\n2️⃣ Testing Email Persistence...');
  const emailSuccess = await persistEmailToSheets(
    testEmailDraft as any,
    testEmailResult as any,
    { success: true, threadId: 'test-thread-123' },
  );
  if (emailSuccess) {
    logInfo('✅ Email persisted successfully!');
  } else {
    logWarn('❌ Failed to persist email');
  }

  // Test 3: Persist Event
  logInfo('\n3️⃣ Testing Event Persistence...');
  const testEvent = createEventRow(
    testJob.job_id,
    'sent',
    testContact.contact_id,
    { email_id: testEmailDraft.email_id, thread_id: 'test-thread-123' },
    'Test email sent event',
  );
  const eventSuccess = await persistEventToSheets(testEvent);
  if (eventSuccess) {
    logInfo('✅ Event persisted successfully!');
  } else {
    logWarn('❌ Failed to persist event');
  }

  // Summary
  logInfo('\n' + '='.repeat(60));
  logInfo('📊 TEST SUMMARY:');
  logInfo('='.repeat(60));
  logInfo(`Contacts: ${contactSuccess ? '✅' : '❌'}`);
  logInfo(`Emails: ${emailSuccess ? '✅' : '❌'}`);
  logInfo(`Events: ${eventSuccess ? '✅' : '❌'}`);

  if (contactSuccess && emailSuccess && eventSuccess) {
    logInfo('\n🎉 All persistence tests passed!');
    logInfo('Check your Google Sheet - you should see:');
    logInfo('  - "contacts" tab: 1 test contact');
    logInfo('  - "emails" tab: 1 test email');
    logInfo('  - "events" tab: 1 test event');
  } else {
    logWarn('\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

main().catch((err) => {
  logWarn('Error testing Sheets persistence:', err);
  process.exit(1);
});

