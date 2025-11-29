// Prepare data payloads for Google Sheets upsert operations

import { ContactRow, EventRow } from './types';
import { ReferralEmailDraft } from './emailDrafts';

/**
 * Flatten a ContactRow for Google Sheets
 * Converts arrays to comma-separated strings, ensures no nested objects
 */
export function buildContactsSheetRow(contact: ContactRow): Record<string, string | number> {
  return {
    contact_id: contact.contact_id,
    job_id: contact.job_id,
    company_slug: contact.company_slug,
    full_name: contact.full_name,
    first_name: contact.first_name,
    last_name: contact.last_name,
    title: contact.title,
    seniority: contact.seniority,
    team_function: contact.team_function,
    email: contact.email,
    linkedin_url: contact.linkedin_url || '',
    source: contact.source,
    verified_status: contact.verified_status,
    score: contact.score,
    signals_json: contact.signals_json || '{}',
    status: contact.status,
    last_contacted_at: contact.last_contacted_at || '',
    followup_stage: contact.followup_stage,
    created_at: contact.created_at,
  };
}

/**
 * Flatten a ReferralEmailDraft for Google Sheets
 * Converts attachments array to comma-separated string
 */
export function buildEmailsSheetRow(draft: ReferralEmailDraft): Record<string, string> {
  return {
    email_id: draft.email_id,
    contact_id: draft.contact_id,
    job_id: draft.job_id,
    variant_id: draft.variant_id,
    subject_a: '', // Will be populated from ReferralEmailResult if needed
    subject_b: '', // Will be populated from ReferralEmailResult if needed
    subject_used: draft.subject,
    body: draft.body,
    proof_point: '', // Will be populated from email generation context
    attachments: draft.attachments.join(','),
    approved: 'false',
    scheduled_at: '',
    sent_at: '',
    thread_id: '',
    status: 'draft',
    last_error: '',
  };
}

/**
 * Flatten an EventRow for Google Sheets
 * Ensures payload_json is a string
 */
export function buildEventsSheetRow(event: EventRow): Record<string, string> {
  return {
    event_id: event.event_id,
    contact_id: event.contact_id || '',
    job_id: event.job_id,
    type: event.type,
    timestamp: event.timestamp,
    payload_json: typeof event.payload_json === 'string' 
      ? event.payload_json 
      : JSON.stringify(event.payload_json),
    notes: event.notes || '',
  };
}

/**
 * Helper to create an event row
 */
export function createEventRow(
  jobId: string,
  type: EventRow['type'],
  contactId?: string,
  payload?: Record<string, any>,
  notes?: string,
): EventRow {
  return {
    event_id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    contact_id: contactId || '',
    job_id: jobId,
    type: type,
    timestamp: new Date().toISOString(),
    payload_json: payload ? JSON.stringify(payload) : '{}',
    notes: notes || '',
  };
}

