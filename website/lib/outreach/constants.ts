// Client-safe outreach types + status metadata (no server imports).

export type SequenceStatus = 'active' | 'replied' | 'completed' | 'stopped';
export type StepStatus = 'pending' | 'sent' | 'skipped';

export interface SequenceStepView {
  id: string;
  step_no: number;
  send_after_days: number;
  subject: string | null;
  body: string | null;
  status: StepStatus;
  scheduled_for: string | null;
  sent_at: string | null;
}

export interface SequenceView {
  id: string;
  status: SequenceStatus;
  contact_name: string | null;
  contact_email: string | null;
  contact_title: string | null;
  company: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
  steps: SequenceStepView[];
}

export const SEQ_STATUS_META: Record<SequenceStatus, { label: string; badge: string }> = {
  active: { label: 'Active', badge: 'bg-blue-100 text-blue-700' },
  replied: { label: 'Replied', badge: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', badge: 'bg-gray-100 text-gray-700' },
  stopped: { label: 'Stopped', badge: 'bg-red-100 text-red-700' },
};

export const STEP_STATUS_META: Record<StepStatus, { label: string; badge: string }> = {
  pending: { label: 'Scheduled', badge: 'bg-amber-100 text-amber-800' },
  sent: { label: 'Sent', badge: 'bg-green-100 text-green-700' },
  skipped: { label: 'Skipped', badge: 'bg-gray-100 text-gray-600' },
};
