// Email draft creation and management

import { ReferralEmailResult, JobRow, ContactRow } from './types';

export interface ReferralEmailDraft {
  email_id: string;
  job_id: string;
  contact_id: string;
  subject: string;
  body: string;
  variant_id: string;
  created_at: string;
  attachments: string[];
}

/**
 * Generate a unique email ID
 */
function generateEmailId(jobId: string, contactId: string, variantId: string): string {
  const timestamp = Date.now().toString(36);
  const shortJob = jobId.slice(-8);
  const shortContact = contactId.slice(-6);
  return `email-${shortJob}-${shortContact}-${variantId}-${timestamp}`;
}

/**
 * Create a referral email draft from Gemini result
 */
export function createReferralEmailDraft(
  result: ReferralEmailResult,
  job: JobRow,
  contact: ContactRow,
  attachments: string[],
  variantId: string = 'referral_v1',
): ReferralEmailDraft {
  // Randomly pick subject_a or subject_b
  const useSubjectA = Math.random() < 0.5;
  const subject = useSubjectA ? result.subject_a : result.subject_b;

  const emailId = generateEmailId(job.job_id, contact.contact_id, variantId);

  return {
    email_id: emailId,
    job_id: job.job_id,
    contact_id: contact.contact_id,
    subject: subject,
    body: result.body,
    variant_id: variantId,
    created_at: new Date().toISOString(),
    attachments: attachments,
  };
}

