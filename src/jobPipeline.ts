#!/usr/bin/env node

// Full pipeline orchestrator for processing a single job end-to-end

import fs from 'fs';
import { JobRow, ContactRow, JDInsights, EventRow } from './types';
import { extractJdInsights } from './jdInsights';
import {
  callGeminiResumeCustomization,
  callGeminiCoverLetter,
} from './geminiStubs';
import { getJobFolder, getResumePath, getCoverLetterPath } from './paths';
import { generateReferralEmailForContact } from './emailOrchestrator';
import { createReferralEmailDraft } from './emailDrafts';
import { createEventRow } from './sheetsPayload';
import { scoreContactsForJob, mergeAndDedupeContacts, normalizeContact } from './contacts';
import { config } from './config';
import { loadEnv } from './env';
import { logInfo, logWarn, logError } from './logger';
import { getJobRowFromSheets } from './sheetsClient';
import { discoverContactsForJob, DiscoveredContactRaw } from './contactsDiscovery';
import { sendReferralEmailDraft } from './gmailClient';
import { getRateLimiter } from './rateLimiter';
import {
  persistContactsBatch,
  persistEmailsBatch,
  persistEventsBatch,
  updateEmailStatusInSheets,
} from './sheetsWriter';

// Load environment variables
loadEnv();

/**
 * Load job row from Google Sheets, with fallback to stub
 */
async function getJobRow(jobId: string): Promise<JobRow> {
  const fromSheets = await getJobRowFromSheets(jobId);
  if (fromSheets) {
    logInfo('Loaded job from Google Sheets:', jobId);
    return fromSheets;
  }

  // Fallback stub (current behavior)
  logWarn('Falling back to stubbed JobRow for jobId:', jobId);
  return {
    job_id: jobId,
    company: 'XYZ Bank',
    company_slug: 'xyz-bank',
    domain: 'xyz.com',
    job_title: 'Data Scientist, Risk',
    job_family: 'Data Science',
    job_location: 'New York, NY',
    job_url: 'https://xyz.com/careers/123',
    jd_text:
      'Responsibilities: build credit risk models, partner with risk teams, present insights.\nRequirements: 3+ years credit risk modeling, Python/SQL, experience with model governance.\nNice to have: Spark, AWS, fraud analytics.',
    jd_keywords: 'credit risk,python,sql',
    resume_status: 'pending',
    cover_letter_status: 'pending',
    status: 'ready',
    notes: '',
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Discover and normalize contacts for a job
 */
async function discoverContacts(job: JobRow): Promise<ContactRow[]> {
  const discovered = await discoverContactsForJob(job);

  if (discovered.length === 0) {
    logWarn(`No contacts discovered for job ${job.job_id}`);
    return [];
  }

  // Normalize discovered contacts into ContactRow format
  const normalized: ContactRow[] = [];
  for (const raw of discovered) {
    const normalizedContact = normalizeContact(
      raw,
      raw.source || 'hunter',
      job.job_id,
      job.company_slug,
    );

    if (normalizedContact) {
      // Infer seniority from title
      const title = normalizedContact.title.toLowerCase();
      let seniority: any = 'IC';
      if (title.includes('vp') || title.includes('vice president')) {
        seniority = 'VP';
      } else if (title.includes('director')) {
        seniority = 'Director';
      } else if (title.includes('manager') || title.includes('head')) {
        seniority = 'Manager';
      } else if (title.includes('lead')) {
        seniority = 'Lead';
      }

      normalizedContact.seniority = seniority;

      // Infer team function
      if (title.includes('talent') || title.includes('recruiter') || title.includes('hr')) {
        normalizedContact.team_function = 'Talent';
      } else if (title.includes('data')) {
        normalizedContact.team_function = 'Data';
      } else {
        normalizedContact.team_function = 'Recruiting';
      }

      normalized.push(normalizedContact);
    }
  }

  return normalized;
}

/**
 * Apply resume updates to base template
 */
function applyResumeUpdates(
  baseResume: string,
  updates: { latexBody?: string; sections?: any[] },
): string {
  return updates.latexBody || baseResume;
}

/**
 * Run the full pipeline for a single job
 */
export async function runJobPipeline(jobId: string): Promise<void> {
  logInfo('Starting pipeline for job:', jobId);
  logInfo('='.repeat(60));

  // 1. Load job
  logInfo('[INFO] Loading job...');
  const job = await getJobRow(jobId);
  logInfo('Job:', job.job_title, 'at', job.company);

  // 2. Extract JD insights
  logInfo('[INFO] Extracting JD insights...');
  const jdInsights = extractJdInsights(job);
  logInfo(`Extracted ${jdInsights.jd_keywords.length} keywords`);
  logInfo(`Top requirements: ${jdInsights.top_requirements.length}`);

  // 3. Generate resume + cover letter
  logInfo('[INFO] Generating resume via Gemini...');
  const resumeTemplatePath = config.RESUME_TEMPLATE_PATH as string;
  const baseResume = fs.existsSync(resumeTemplatePath)
    ? fs.readFileSync(resumeTemplatePath, 'utf8')
    : '% Base resume template\n\\begin{document}\n\\end{document}';

  const resumeResponse = await callGeminiResumeCustomization(job, jdInsights, baseResume);
  const updatedResume = applyResumeUpdates(baseResume, resumeResponse);

  logInfo('[INFO] Generating cover letter via Gemini...');
  const candidateProfile = 'Ojas Sharma — data scientist with credit risk background.';
  const proofPoint = 'Detected 13% more high-risk gamblers via unsupervised clustering.';
  const coverLetterResponse = await callGeminiCoverLetter(
    job,
    jdInsights,
    candidateProfile,
    proofPoint,
  );

  // 4. Ensure folder + write files
  logInfo('[INFO] Writing resume.tex...');
  const folder = getJobFolder(job);
  fs.mkdirSync(folder, { recursive: true });
  const resumePath = getResumePath(job);
  const coverLetterPath = getCoverLetterPath(job);
  fs.writeFileSync(resumePath, updatedResume, 'utf8');
  fs.writeFileSync(coverLetterPath, coverLetterResponse.cover_letter, 'utf8');
  logInfo('Resume:', resumePath);
  logInfo('Cover letter:', coverLetterPath);

  // 5. Discover contacts
  logInfo('[INFO] Discovering contacts...');
  const contacts = await discoverContacts(job);
  if (contacts.length === 0) {
    logWarn(`No contacts found for job ${job.job_id}, skipping email generation`);
    logInfo('[INFO] Pipeline complete (no contacts to process).');
    return;
  }
  logInfo(`Found ${contacts.length} contacts`);

  // 6. Score contacts
  logInfo('[INFO] Scoring contacts...');
  const scoredContacts = scoreContactsForJob(job, contacts);
  logInfo(`Scored contacts (top 3):`);
  scoredContacts.slice(0, 3).forEach((c, i) => {
    logInfo(`${i + 1}. ${c.full_name} (${c.title}) - Score: ${c.score}`);
  });

  // 7. Persist contacts to Sheets
  logInfo('[INFO] Persisting contacts to Sheets...');
  const contactsPersisted = await persistContactsBatch(scoredContacts, job);
  logInfo(`Persisted ${contactsPersisted}/${scoredContacts.length} contacts to Sheets`);

  // 8. Generate referral emails for each contact
  logInfo(`[INFO] Generating referral emails for ${scoredContacts.length} contacts...`);
  const drafts: Array<{
    draft: any;
    contact: ContactRow;
    emailResult: any;
    sentResult?: { threadId?: string; messageId?: string; success: boolean; error?: string };
  }> = [];
  const events: EventRow[] = [];
  const rateLimiter = getRateLimiter({
    maxEmailsPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MINUTE || '5'),
    maxEmailsPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '50'),
    maxEmailsPerDay: parseInt(process.env.EMAIL_RATE_LIMIT_PER_DAY || '500'),
    delayBetweenEmails: parseInt(process.env.EMAIL_DELAY_MS || '2000'),
  });

  const shouldSendEmails = process.env.SEND_EMAILS === 'true' || process.env.SEND_EMAILS === '1';

  for (const contact of scoredContacts) {
    try {
      const emailResult = await generateReferralEmailForContact(
        job,
        contact,
        jdInsights,
      );

      const draft = createReferralEmailDraft(
        emailResult,
        job,
        contact,
        [resumePath, coverLetterPath],
      );

      let sentResult: { threadId?: string; messageId?: string; success: boolean; error?: string } | undefined;

      // Send email if enabled
      if (shouldSendEmails) {
        // Wait for rate limiter
        await rateLimiter.waitUntilCanSend(job.domain);

        logInfo(`Sending email to ${contact.full_name} (${contact.email})...`);
        sentResult = await sendReferralEmailDraft(draft, contact.email);
        rateLimiter.recordSent(job.domain);

        if (sentResult.success) {
          logInfo(`✅ Email sent successfully. Thread ID: ${sentResult.threadId}`);
          const sentEvent = createEventRow(
            job.job_id,
            'sent',
            contact.contact_id,
            { email_id: draft.email_id, thread_id: sentResult.threadId },
            `Email sent to ${contact.full_name}`,
          );
          events.push(sentEvent);
        } else {
          logError(`❌ Failed to send email: ${sentResult.error}`);
          const errorEvent = createEventRow(
            job.job_id,
            'error',
            contact.contact_id,
            { email_id: draft.email_id, error: sentResult.error },
            `Failed to send email to ${contact.full_name}`,
          );
          events.push(errorEvent);
        }
      } else {
        logInfo(`Email sending disabled (SEND_EMAILS=${process.env.SEND_EMAILS}). Draft created only.`);
      }

      drafts.push({ draft, contact, emailResult, sentResult });

      logInfo(`${contact.full_name}: ${draft.subject}`);
    } catch (error) {
      logError(`Error generating/sending email for ${contact.full_name}:`, error);
      const errorEvent = createEventRow(
        job.job_id,
        'error',
        contact.contact_id,
        { error: String(error) },
        `Failed to generate/send email for ${contact.full_name}`,
      );
      events.push(errorEvent);
    }
  }

  // 9. Persist emails to Sheets
  logInfo('[INFO] Persisting emails to Sheets...');
  const emailsPersisted = await persistEmailsBatch(drafts);
  logInfo(`Persisted ${emailsPersisted}/${drafts.length} emails to Sheets`);

  // 10. Persist events to Sheets
  logInfo('[INFO] Persisting events to Sheets...');
  const eventsPersisted = await persistEventsBatch(events);
  logInfo(`Persisted ${eventsPersisted}/${events.length} events to Sheets`);

  // 11. Print summary
  logInfo('='.repeat(60));
  logInfo('Pipeline Summary');
  logInfo('='.repeat(60));
  logInfo('Job:', job.job_title, 'at', job.company);
  logInfo('Files generated:');
  logInfo('  Resume:', resumePath);
  logInfo('  Cover letter:', coverLetterPath);
  logInfo(`Contacts processed: ${drafts.length}/${scoredContacts.length}`);
  logInfo(`Contacts persisted: ${contactsPersisted}`);
  logInfo(`Email drafts created: ${drafts.length}`);
  logInfo(`Emails persisted: ${emailsPersisted}`);
  if (shouldSendEmails) {
    const sentCount = drafts.filter((d) => d.sentResult?.success).length;
    const failedCount = drafts.filter((d) => d.sentResult && !d.sentResult.success).length;
    logInfo(`Emails sent: ${sentCount}`);
    if (failedCount > 0) {
      logInfo(`Emails failed: ${failedCount}`);
    }
  } else {
    logInfo('Emails not sent (SEND_EMAILS not enabled)');
  }
  logInfo(`Events logged: ${events.length}`);
  logInfo(`Events persisted: ${eventsPersisted}`);
  logInfo('[INFO] Pipeline complete.');
}

/**
 * CLI entry point
 */
async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error('Usage: jobPipeline.ts <jobId>');
    console.error('Example: npm run pipeline ds-risk-xyz-001');
    process.exit(1);
  }

  await runJobPipeline(jobId);
}

// Run if called directly (tsx/node execution)
main().catch((err) => {
  console.error('Pipeline error:', err);
  process.exit(1);
});

