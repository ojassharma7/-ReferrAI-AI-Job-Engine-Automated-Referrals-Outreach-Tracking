#!/usr/bin/env node

// Main script to generate customized resume and cover letter for a job

import fs from 'fs';
import path from 'path';
import { JobRow, JDInsights } from './types';
import { config } from './config';
import { extractJdInsights } from './jdInsights';
import { getJobFolder, getResumePath, getCoverLetterPath } from './paths';
import {
  callGeminiResumeCustomization,
  callGeminiCoverLetter,
} from './geminiStubs';
import { loadEnv } from './env';
import { logInfo, logWarn, logError } from './logger';
import { getJobRowFromSheets } from './sheetsClient';

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
 * Ensure directory exists, creating parent directories if needed
 */
function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Apply resume updates to base template
 * In production, this would parse structured updates and apply them to LaTeX sections
 */
function applyResumeUpdates(
  baseResume: string,
  updates: { latexBody?: string; sections?: any[] },
): string {
  // Stub: In reality, parse sections and apply structured updates
  // For now, return the provided latexBody or fall back to base
  return updates.latexBody || baseResume;
}

async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error('Usage: generateApplicationForJob.ts <jobId>');
    process.exit(1);
  }

  logInfo('Generating application materials for job:', jobId);

  // Load job data
  const job = await getJobRow(jobId);
  logInfo('Job:', job.job_title, 'at', job.company);

  // Extract JD insights
  const jdInsights = extractJdInsights(job);
  logInfo(`Extracted ${jdInsights.jd_keywords.length} keywords`);

  // Load base resume template
  const resumeTemplatePath = config.RESUME_TEMPLATE_PATH as string;
  if (!fs.existsSync(resumeTemplatePath)) {
    logWarn(
      `Resume template not found at ${resumeTemplatePath}. Using empty template.`,
    );
  }
  const baseResume = fs.existsSync(resumeTemplatePath)
    ? fs.readFileSync(resumeTemplatePath, 'utf8')
    : '% Base resume template\n\\begin{document}\n\\end{document}';

  // Generate customized resume
  logInfo('Calling Gemini for resume customization...');
  const resumeResponse = await callGeminiResumeCustomization(job, jdInsights, baseResume);
  const updatedResume = applyResumeUpdates(baseResume, resumeResponse);

  // Generate cover letter
  const candidateProfile =
    'Ojas Sharma — data scientist with credit risk background.';
  const proofPoint =
    'Detected 13% more high-risk gamblers via unsupervised clustering.';
  logInfo('Calling Gemini for cover letter generation...');
  const coverLetterResponse = await callGeminiCoverLetter(
    job,
    jdInsights,
    candidateProfile,
    proofPoint,
  );

  // Ensure output directory exists
  const folder = getJobFolder(job);
  ensureDir(folder);
  logInfo('Output directory:', folder);

  // Write files
  const resumePath = getResumePath(job);
  const coverLetterPath = getCoverLetterPath(job);

  fs.writeFileSync(resumePath, updatedResume, 'utf8');
  fs.writeFileSync(coverLetterPath, coverLetterResponse.cover_letter, 'utf8');

  logInfo('Successfully generated application materials:');
  logInfo('  Resume:', resumePath);
  logInfo('  Cover Letter:', coverLetterPath);
}

main().catch((err) => {
  logError('Error generating application materials:', err);
  process.exit(1);
});

