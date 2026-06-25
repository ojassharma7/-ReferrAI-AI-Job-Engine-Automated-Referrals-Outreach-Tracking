// API Route: Search for contacts and jobs

import { NextRequest, NextResponse } from 'next/server';
import { lookupCompany } from '@/lib/apollo-client';
import { searchRecruiters as hunterSearchRecruiters, searchDomainEmployees as hunterSearchDomainEmployees } from '@/lib/hunter-client';
import { searchJobs } from '@/lib/job-search-client';
import { SearchResult, Job } from '@/lib/types';
import { getAppUser } from '@/lib/auth';
import { persistSearchResult } from '@/lib/db/persist';
import { enforceLimit, recordUsage } from '@/lib/usage';
import { contactsAreMock, jobsAreMock, mockRecruiters, mockDomainEmployees } from '@/lib/mock';

export async function POST(request: NextRequest) {
  console.log('🚀 /api/search endpoint called');
  try {
    const user = await getAppUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Enforce the per-plan usage limit before doing any paid work.
    const limit = await enforceLimit(user, 'search');
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.message, code: 'limit_reached' },
        { status: 402 },
      );
    }

    const body = await request.json();
    const { company, role } = body;
    console.log('📥 Request received:', { company, role });

    if (!company || !role) {
      return NextResponse.json(
        { error: 'Company and role are required' },
        { status: 400 }
      );
    }

    // 1. Try Apollo.io lookup
    let companyData: any = null;
    try {
      companyData = await lookupCompany(company);
    } catch (error: any) {
      console.warn('Apollo.io company lookup failed:', error.message);
      // Create fallback company data
      companyData = {
        id: `company-${Date.now()}`,
        name: company,
        domain: extractDomain(company),
      };
    }

    // 2. Discover contacts via Hunter. Passing the company NAME lets Hunter
    //    resolve the real domain (e.g. "Zest AI" -> zest.ai), and the department
    //    filter (mapped from the role) returns people in the searched role.
    let recruiters: any[] = [];
    let domainEmployees: any[] = [];
    const domain = companyData.domain || extractDomain(company);

    if (process.env.HUNTER_API_KEY) {
      try {
        [recruiters, domainEmployees] = await Promise.all([
          hunterSearchRecruiters(company, domain),
          hunterSearchDomainEmployees(company, role, domain),
        ]);
        console.log(`Hunter: ${recruiters.length} recruiters, ${domainEmployees.length} employees`);
      } catch (e: any) {
        console.warn('Hunter search failed:', e.message);
      }
    }

    // Last-resort demo data only when no contact provider is configured.
    if (contactsAreMock()) {
      recruiters = mockRecruiters(company);
      domainEmployees = mockDomainEmployees(company, role);
    }

    // The real domain is whatever Hunter resolved (from the contact emails).
    const resolvedDomain =
      [...recruiters, ...domainEmployees]
        .map((c) => c.email?.split('@')[1])
        .find((d: string | undefined) => d && !d.includes('mock')) || domain;

    // 4. Format company data
    const companyResult = {
      id: companyData.id || `company-${Date.now()}`,
      name: companyData.name || company,
      domain: resolvedDomain || companyData.primary_domain || companyData.domain || extractDomain(company),
      industry: companyData.industry,
      size: companyData.estimated_num_employees || companyData.size,
      location: companyData.primary_location?.city || companyData.location,
      website: companyData.website_url || companyData.website,
      linkedin_url: companyData.linkedin_url,
    };

    // 5. Format contacts helper - with better handling of missing fields
    const formatContact = (contact: any, source: string = 'apollo') => {
      // Build full name from available parts
      let fullName = contact.full_name || contact.name;
      if (!fullName) {
        const firstName = contact.first_name || '';
        const lastName = contact.last_name || '';
        fullName = firstName && lastName 
          ? `${firstName} ${lastName}`.trim()
          : firstName || lastName || contact.email?.split('@')[0] || 'Unknown';
      }

      // Get title - try multiple fields
      const title = contact.title || contact.position || contact.job_title || 'No title available';

      // Get email status
      const emailStatus = contact.email_status || contact.verified_status || 
                         (contact.verified ? 'verified' : 'unknown');
      const isVerified = emailStatus === 'verified' || 
                       emailStatus === 'valid' || 
                       contact.verified === true ||
                       contact.verification?.status === 'valid';

      return {
        id: contact.id || contact.contact_id || `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyResult.id,
        email: contact.email || contact.email_address || '',
        full_name: fullName,
        first_name: contact.first_name || fullName.split(' ')[0] || '',
        last_name: contact.last_name || fullName.split(' ').slice(1).join(' ') || '',
        title: title,
        department: contact.department || contact.team_function || contact.organization_department || '',
        seniority: inferSeniority(title),
        linkedin_url: contact.linkedin_url || contact.linkedin || contact.social_links?.linkedin || '',
        phone: contact.phone_number || contact.phone || contact.phone_numbers?.[0] || '',
        email_verified: isVerified,
        email_status: emailStatus as 'verified' | 'likely' | 'guessed' | 'invalid' | 'unknown',
        relevance_score: calculateRelevanceScore(title, role),
        source: contact.source || source,
      };
    };

    const formattedRecruiters = recruiters
      .filter(contact => contact.email || contact.full_name || contact.name) // Only include contacts with at least email or name
      .map(contact => formatContact(contact, 'hunter'));
    
    const formattedDomainEmployees = domainEmployees
      .filter(contact => contact.email || contact.full_name || contact.name) // Only include contacts with at least email or name
      .map(contact => formatContact(contact, 'hunter'));

    // 6. Search for jobs
    let jobs: Job[] = [];
    try {
      const jobResults = await searchJobs(company, role, companyResult.location || undefined);
      jobs = jobResults.map((job) => ({
        id: job.job_id || `job-${Date.now()}-${Math.random()}`,
        company_id: companyResult.id,
        title: job.job_title,
        location: [job.job_city, job.job_state, job.job_country]
          .filter(Boolean)
          .join(', ') || 'Location not specified',
        job_type: job.job_employment_type || 'Full-time',
        jd_text: job.job_description || 'No description available',
        jd_url: job.job_apply_link || job.job_google_link,
        source: 'jsearch' as const,
        posted_at: job.job_posted_at_datetime_utc,
      }));
    } catch (jobError: any) {
      console.warn('Job search failed:', jobError.message);
      // Continue without jobs (graceful degradation)
    }

    // 7. Build response
    const result: SearchResult = {
      company: companyResult,
      recruiters: formattedRecruiters,
      domainEmployees: formattedDomainEmployees,
      jobs: jobs,
      totalContacts: formattedRecruiters.length + formattedDomainEmployees.length,
      totalJobs: jobs.length,
      isMock: contactsAreMock(),
      jobsMock: jobsAreMock(),
    };

    console.log('Search completed successfully:', {
      company: result.company.name,
      recruiters: result.recruiters.length,
      domainEmployees: result.domainEmployees.length,
      jobs: result.jobs.length,
      totalContacts: result.totalContacts,
    });

    // Persist (best-effort) and record usage against the plan limit.
    await persistSearchResult(user, result);
    await recordUsage(user, 'search');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Search API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

function inferSeniority(title: string): 'IC' | 'Lead' | 'Manager' | 'Director' | 'VP' | 'C-level' {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('vp') || titleLower.includes('vice president')) return 'VP';
  if (titleLower.includes('director')) return 'Director';
  if (titleLower.includes('manager') || titleLower.includes('head')) return 'Manager';
  if (titleLower.includes('lead') || titleLower.includes('senior')) return 'Lead';
  if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('cfo')) return 'C-level';
  return 'IC';
}

function calculateRelevanceScore(title: string, role: string): number {
  const t = (title || '').toLowerCase().trim();
  const r = (role || '').toLowerCase().trim();
  if (!t) return 0;
  if (t.includes(r)) return 100; // exact role phrase in the title

  // Prefix token match so "Data Science" scores high for a "Data Scientist" search.
  const tokens = r.split(/\s+/).filter((x) => x.length > 2);
  const hits = tokens.filter((tok) => t.includes(tok.slice(0, 5))).length;
  if (tokens.length && hits === tokens.length) return 90;
  if (hits) return 62 + (hits - 1) * 12;

  // Adjacent role families.
  const related: Record<string, string[]> = {
    'data scientist': ['machine learning', 'ml ', 'applied scien', 'research scien', 'analytics'],
    'software engineer': ['developer', 'programmer', 'swe', 'full stack', 'backend', 'frontend'],
    'product manager': ['product owner', 'product lead'],
  };
  const fam = related[r];
  if (fam && fam.some((k) => t.includes(k))) return 78;
  return 45;
}

function extractDomain(companyName: string): string | null {
  // Try to extract domain from company name
  // This is a simple heuristic - in production, use a domain lookup service
  const commonDomains: Record<string, string> = {
    'google': 'google.com',
    'microsoft': 'microsoft.com',
    'amazon': 'amazon.com',
    'apple': 'apple.com',
    'meta': 'meta.com',
    'facebook': 'facebook.com',
  };

  const companyLower = companyName.toLowerCase().trim();
  
  // Check common companies
  for (const [key, domain] of Object.entries(commonDomains)) {
    if (companyLower.includes(key)) {
      return domain;
    }
  }

  // Try to infer from company name
  // Remove common suffixes and convert to domain
  const cleaned = companyLower
    .replace(/\s+(inc|llc|corp|corporation|company|co)$/i, '')
    .replace(/\s+/g, '')
    .toLowerCase();
  
  return `${cleaned}.com`;
}

function isRecruiter(title: string): boolean {
  if (!title) return false;
  const titleLower = title.toLowerCase();
  const recruiterKeywords = [
    'recruiter', 'talent acquisition', 'hiring manager',
    'hr manager', 'people operations', 'recruiting',
  ];
  return recruiterKeywords.some(keyword => titleLower.includes(keyword));
}

function matchesRole(title: string, role: string): boolean {
  if (!title) return false;
  const titleLower = title.toLowerCase();
  const roleLower = role.toLowerCase();
  return titleLower.includes(roleLower);
}

