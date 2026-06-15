// Client-safe pipeline constants + types. Kept separate from lib/db/applications
// (which is server-only) so client components can import these without pulling
// next/headers into the browser bundle.

export const APPLICATION_STATUSES = [
  'saved',
  'contacted',
  'replied',
  'referred',
  'interview',
  'offer',
  'rejected',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationCard {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job: { title: string | null; company: string | null; location: string | null } | null;
  contact: { full_name: string | null; title: string | null; email: string | null } | null;
}

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; dot: string; badge: string }
> = {
  saved: { label: 'Saved', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' },
  contacted: { label: 'Contacted', dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700' },
  replied: { label: 'Replied', dot: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-700' },
  referred: { label: 'Referred', dot: 'bg-violet-400', badge: 'bg-violet-100 text-violet-700' },
  interview: { label: 'Interview', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800' },
  offer: { label: 'Offer', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', dot: 'bg-red-400', badge: 'bg-red-100 text-red-700' },
};
