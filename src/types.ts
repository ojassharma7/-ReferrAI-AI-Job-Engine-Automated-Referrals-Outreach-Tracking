// Type definitions for ReferrAI job-referral engine

export type JobStatus = 'ready' | 'in_progress' | 'queued' | 'no_contacts' | 'completed';
export type ResumeStatus = 'pending' | 'generated' | 'error';
export type CoverLetterStatus = 'pending' | 'generated' | 'error';

export interface JobRow {
  job_id: string;
  company: string;
  company_slug: string;
  domain: string;
  job_title: string;
  job_family: string;
  job_location: string;
  job_url: string;
  jd_text: string;
  jd_keywords: string; // comma-separated keywords
  resume_status: ResumeStatus;
  cover_letter_status: CoverLetterStatus;
  status: JobStatus;
  notes: string;
  last_synced_at: string; // ISO timestamp
}

export type ContactStatus =
  | 'new'
  | 'approved'
  | 'emailed'
  | 'followup_pending'
  | 'replied'
  | 'do_not_contact';

export type Seniority = 'IC' | 'Lead' | 'Manager' | 'Director' | 'VP' | 'C-level';
export type VerifiedStatus = 'verified' | 'guessed' | 'unknown';
export type ContactSource = 'hunter' | 'jobrights' | 'manual' | 'other';

export interface ContactRow {
  contact_id: string;
  job_id: string;
  company_slug: string;
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  seniority: Seniority;
  team_function: string;
  email: string;
  linkedin_url: string;
  source: ContactSource;
  verified_status: VerifiedStatus;
  score: number;
  signals_json: string;
  status: ContactStatus;
  last_contacted_at: string;
  followup_stage: number;
  created_at: string;
}

export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';

export interface EmailRow {
  email_id: string;
  contact_id: string;
  job_id: string;
  variant_id: string;
  subject_a: string;
  subject_b: string;
  subject_used: string;
  body: string;
  proof_point: string;
  attachments: string; // comma-separated paths
  approved: boolean;
  scheduled_at: string;
  sent_at: string;
  thread_id: string;
  status: EmailStatus;
  last_error: string;
}

export type EventType =
  | 'sent'
  | 'reply'
  | 'positive'
  | 'bounce'
  | 'followup'
  | 'error'
  | 'resume_generated'
  | 'cover_letter_generated';

export interface EventRow {
  event_id: string;
  contact_id: string;
  job_id: string;
  type: EventType;
  timestamp: string;
  payload_json: string;
  notes: string;
}

export interface JDInsights {
  jd_keywords: string[];
  top_requirements: string[];
  nice_to_have: string[];
}

export interface ConfigMap {
  MAX_EMAILS_PER_DAY: number;
  MAX_EMAILS_PER_COMPANY_PER_DAY: number;
  MAX_CONTACTS_PER_JOB?: number;
  DELAY_BETWEEN_EMAILS_MIN: number;
  DELAY_BETWEEN_EMAILS_MAX: number;
  FOLLOWUP_OFFSETS_DAYS: number[];
  GEMINI_MODEL: string;
  HUNTER_TITLE_FILTERS: string[];
  JOBRIGHTS_TITLE_FILTERS: string[];
  RESUME_TEMPLATE_PATH: string;
  COVER_LETTER_TEMPLATE_PATH: string;
  GIT_AUTO_COMMIT?: boolean;
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

export interface ResumeCustomizationResponse {
  sections: Array<{
    sectionId: string;
    action: 'replace' | 'append' | 'reorder';
    content: string;
    rationale?: string;
  }>;
  latexBody?: string;
  notes?: string;
}

export interface CoverLetterResponse {
  cover_letter: string;
  summaryBullets?: string[];
}

export interface ReferralEmailResult {
  subject_a: string;
  subject_b: string;
  body: string;
}

