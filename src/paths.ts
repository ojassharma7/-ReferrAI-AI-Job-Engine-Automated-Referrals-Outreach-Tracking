// Filesystem path utilities for organizing job outputs

import { JobRow } from './types';
import path from 'path';

/**
 * Get the output folder path for a job
 */
export function getJobFolder(job: JobRow): string {
  return path.join(process.cwd(), 'outputs', job.company_slug, job.job_id);
}

/**
 * Get the resume file path for a job
 */
export function getResumePath(job: JobRow): string {
  return path.join(getJobFolder(job), 'resume.tex');
}

/**
 * Get the cover letter file path for a job
 */
export function getCoverLetterPath(job: JobRow): string {
  return path.join(getJobFolder(job), 'cover_letter.tex');
}

