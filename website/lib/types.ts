// Shared TypeScript types

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
}

export interface Contact {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  title: string;
  department?: string;
  seniority?: 'IC' | 'Lead' | 'Manager' | 'Director' | 'VP' | 'C-level';
  linkedin_url?: string;
  phone?: string;
  email_verified: boolean;
  email_status: 'verified' | 'likely' | 'guessed' | 'invalid';
  relevance_score: number;
  source: 'apollo' | 'hunter' | 'zoominfo';
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  location: string;
  job_type?: string;
  jd_text: string;
  jd_url?: string;
  source: 'linkedin' | 'indeed' | 'glassdoor' | 'company' | 'jsearch';
  posted_at?: string;
}

export interface SearchResult {
  company: Company;
  recruiters: Contact[];
  domainEmployees: Contact[];
  jobs: Job[];
  totalContacts: number;
  totalJobs: number;
}

export interface SearchRequest {
  company: string;
  role: string;
}

