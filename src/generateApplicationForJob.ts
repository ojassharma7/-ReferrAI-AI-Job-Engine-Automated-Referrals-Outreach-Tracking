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

/**
 * Stub: Load job row from data source (to be replaced with Google Sheets API)
 */
function getJobRow(jobId: string): JobRow {
  // TODO: Replace with real Google Sheets API call
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

  console.log(`Generating application materials for job: ${jobId}`);

  // Load job data
  const job = getJobRow(jobId);
  console.log(`Job: ${job.job_title} at ${job.company}`);

  // Extract JD insights
  const jdInsights = extractJdInsights(job);
  console.log(`Extracted ${jdInsights.jd_keywords.length} keywords`);

  // Load base resume template
  const resumeTemplatePath = config.RESUME_TEMPLATE_PATH as string;
  if (!fs.existsSync(resumeTemplatePath)) {
    console.warn(
      `Warning: Resume template not found at ${resumeTemplatePath}. Using empty template.`,
    );
  }
  const baseResume = fs.existsSync(resumeTemplatePath)
    ? fs.readFileSync(resumeTemplatePath, 'utf8')
    : '% Base resume template\n\\begin{document}\n\\end{document}';

  // Generate customized resume
  console.log('Calling Gemini for resume customization...');
  const resumeResponse = callGeminiResumeCustomization(job, jdInsights, baseResume);
  const updatedResume = applyResumeUpdates(baseResume, resumeResponse);

  // Generate cover letter
  const candidateProfile =
    'Ojas Sharma — data scientist with credit risk background.';
  const proofPoint =
    'Detected 13% more high-risk gamblers via unsupervised clustering.';
  console.log('Calling Gemini for cover letter generation...');
  const coverLetterResponse = callGeminiCoverLetter(
    job,
    jdInsights,
    candidateProfile,
    proofPoint,
  );

  // Ensure output directory exists
  const folder = getJobFolder(job);
  ensureDir(folder);
  console.log(`Output directory: ${folder}`);

  // Write files
  const resumePath = getResumePath(job);
  const coverLetterPath = getCoverLetterPath(job);

  fs.writeFileSync(resumePath, updatedResume, 'utf8');
  fs.writeFileSync(coverLetterPath, coverLetterResponse.cover_letter, 'utf8');

  console.log('\n✅ Successfully generated application materials:');
  console.log(`   Resume: ${resumePath}`);
  console.log(`   Cover Letter: ${coverLetterPath}`);
}

main().catch((err) => {
  console.error('Error generating application materials:', err);
  process.exit(1);
});

