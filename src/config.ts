// Configuration management for ReferrAI

import { ConfigMap } from './types';

export const config: ConfigMap = {
  MAX_EMAILS_PER_DAY: 25,
  MAX_EMAILS_PER_COMPANY_PER_DAY: 5,
  MAX_CONTACTS_PER_JOB: 50,
  DELAY_BETWEEN_EMAILS_MIN: 7, // minutes
  DELAY_BETWEEN_EMAILS_MAX: 15, // minutes
  FOLLOWUP_OFFSETS_DAYS: [4, 10],
  GEMINI_MODEL: 'gemini-1.5-pro',
  HUNTER_TITLE_FILTERS: [
    'recruiter',
    'talent',
    'acquisition',
    'hr',
    'people',
    'hiring',
    'manager',
    'director',
    'head',
    'vp',
  ],
  JOBRIGHTS_TITLE_FILTERS: [
    'recruiter',
    'talent',
    'hr',
    'people',
    'hiring',
    'manager',
    'director',
    'head',
    'vp',
  ],
  RESUME_TEMPLATE_PATH: process.env.RESUME_TEMPLATE_PATH || './templates/base_resume.tex',
  COVER_LETTER_TEMPLATE_PATH:
    process.env.COVER_LETTER_TEMPLATE_PATH || './templates/base_cover_letter.tex',
  GIT_AUTO_COMMIT: false,
};

export function getConfig(): ConfigMap {
  return config;
}

