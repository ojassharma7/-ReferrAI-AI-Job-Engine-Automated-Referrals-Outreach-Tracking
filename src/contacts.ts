// Contact processing utilities: normalization, deduplication, scoring, selection

import {
  ContactRow,
  ContactSource,
  VerifiedStatus,
  JobRow,
  JDInsights,
} from './types';

export interface RawContact {
  contact_id?: string;
  job_id?: string;
  company_slug?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  seniority?: string;
  team_function?: string;
  email?: string;
  linkedin_url?: string;
  verified_status?: VerifiedStatus;
  source?: ContactSource;
  score?: number;
  signals_json?: string;
  status?: string;
  last_contacted_at?: string;
  followup_stage?: number;
  created_at?: string;
}

/**
 * Normalize a raw contact object into a ContactRow
 */
export function normalizeContact(
  raw: RawContact,
  source: ContactSource,
  defaultJobId: string,
  defaultCompanySlug: string,
): ContactRow | null {
  if (!raw || !raw.email) return null;

  const fullName =
    raw.full_name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim();
  const email = raw.email.toLowerCase();

  return {
    contact_id:
      raw.contact_id || `${source}-${email.replace(/[^a-z0-9]/g, '-')}`,
    job_id: raw.job_id || defaultJobId,
    company_slug: raw.company_slug || defaultCompanySlug,
    full_name: fullName,
    first_name: raw.first_name || fullName.split(' ')[0] || '',
    last_name:
      raw.last_name ||
      (fullName.includes(' ') ? fullName.split(' ').slice(1).join(' ') : ''),
    title: raw.title || '',
    seniority: (raw.seniority as any) || 'IC',
    team_function: raw.team_function || '',
    email: email,
    linkedin_url: raw.linkedin_url || '',
    source: source,
    verified_status: raw.verified_status || 'unknown',
    score: raw.score || 0,
    signals_json: raw.signals_json || '{}',
    status: (raw.status as any) || 'new',
    last_contacted_at: raw.last_contacted_at || '',
    followup_stage: raw.followup_stage || 0,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

/**
 * Merge and deduplicate contacts from multiple sources
 */
export function mergeAndDedupeContacts(
  sourceArrays: Array<{ data: RawContact[]; source: ContactSource }>,
  defaultJobId: string,
  defaultCompanySlug: string,
): ContactRow[] {
  const priorityVerified: Record<VerifiedStatus, number> = {
    verified: 3,
    guessed: 2,
    unknown: 1,
  };
  const prioritySource: Record<ContactSource, number> = {
    hunter: 2,
    jobrights: 1,
    manual: 3,
    other: 0,
  };

  const map: Record<string, ContactRow> = {};

  sourceArrays.forEach(({ data, source }) => {
    data.forEach((raw) => {
      const normalized = normalizeContact(raw, source, defaultJobId, defaultCompanySlug);
      if (!normalized) return;

      const key = normalized.email;
      if (!map[key]) {
        map[key] = normalized;
        return;
      }

      const existing = map[key];
      const existingScore = priorityVerified[existing.verified_status] || 0;
      const newScore = priorityVerified[normalized.verified_status] || 0;

      if (newScore > existingScore) {
        map[key] = normalized;
        return;
      }

      if (newScore === existingScore) {
        const existingSourceScore = prioritySource[existing.source] || 0;
        const newSourceScore = prioritySource[normalized.source] || 0;
        if (newSourceScore > existingSourceScore) {
          map[key] = normalized;
        }
      }
    });
  });

  return Object.values(map);
}

/**
 * Score a single contact based on role, seniority, and job match
 */
export function scoreContact(contact: ContactRow, job: JobRow): number {
  const title = (contact.title || '').toLowerCase();
  let score = 0;

  const titleKeywords = [
    { regex: /(recruiter|talent|acquisition)/, weight: 40 },
    { regex: /(hr|people ops?|people)/, weight: 30 },
    { regex: /(hiring manager|manager)/, weight: 35 },
    { regex: /(director)/, weight: 45 },
    { regex: /(head|vp|vice president)/, weight: 50 },
    { regex: /(lead|team lead)/, weight: 30 },
  ];

  titleKeywords.forEach(({ regex, weight }) => {
    if (regex.test(title)) score += weight;
  });

  const seniorityWeights: Record<string, number> = {
    IC: 10,
    Lead: 25,
    Manager: 35,
    Director: 45,
    VP: 55,
    'C-level': 60,
  };
  score += seniorityWeights[contact.seniority] || 0;

  const team = (contact.team_function || '').toLowerCase();
  const jobFamily = (job.job_family || '').toLowerCase();
  if (team && jobFamily && team.includes(jobFamily.slice(0, 4))) {
    score += 10;
  }

  if (contact.source === 'hunter') score += 5;
  if (contact.verified_status === 'verified') score += 10;

  return score;
}

/**
 * Score all contacts for a job and sort by score descending
 */
export function scoreContactsForJob(
  job: JobRow,
  contacts: ContactRow[],
): ContactRow[] {
  return contacts
    .map((contact) => {
      contact.score = scoreContact(contact, job);
      return contact;
    })
    .sort((a, b) => b.score - a.score);
}

export interface SelectContactsInput {
  contacts: ContactRow[];
  sentTodayTotal: number;
  sentTodayByCompany: Record<string, number>;
  maxPerDay: number;
  maxPerCompanyPerDay: number;
}

export interface SelectContactsOutput {
  selectedContacts: ContactRow[];
  updatedSentTodayTotal: number;
  updatedSentTodayByCompany: Record<string, number>;
}

/**
 * Select contacts to email while respecting daily and per-company limits
 */
export function selectContactsToEmail(
  input: SelectContactsInput,
): SelectContactsOutput {
  const { contacts, sentTodayTotal, sentTodayByCompany, maxPerDay, maxPerCompanyPerDay } =
    input;

  let sentToday = sentTodayTotal;
  const sentByCompany = { ...sentTodayByCompany };
  const selected: ContactRow[] = [];

  for (const contact of contacts) {
    if (sentToday >= maxPerDay) break;

    const company = contact.company_slug || 'unknown';
    const companyCount = sentByCompany[company] || 0;

    if (companyCount >= maxPerCompanyPerDay) continue;

    selected.push(contact);
    sentToday += 1;
    sentByCompany[company] = companyCount + 1;
  }

  return {
    selectedContacts: selected,
    updatedSentTodayTotal: sentToday,
    updatedSentTodayByCompany: sentByCompany,
  };
}

