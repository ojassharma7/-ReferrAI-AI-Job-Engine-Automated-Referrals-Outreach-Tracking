// API Route: Search for contacts and jobs

import { NextRequest, NextResponse } from 'next/server';
import { searchRecruiters as apolloSearchRecruiters, searchDomainEmployees as apolloSearchDomainEmployees, lookupCompany } from '@/lib/apollo-client';
import { searchRecruiters as hunterSearchRecruiters, searchDomainEmployees as hunterSearchDomainEmployees } from '@/lib/hunter-client';
import { searchJobs } from '@/lib/job-search-client';
import { SearchResult, Job } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, role } = body;

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

    // 2. Try to search for contacts
    let recruiters: any[] = [];
    let domainEmployees: any[] = [];
    
    const domain = companyData.domain || extractDomain(company);
    
    // Try Apollo.io first, fallback to Hunter.io
    let usingApollo = false;
    try {
      recruiters = await apolloSearchRecruiters(company);
      domainEmployees = await apolloSearchDomainEmployees(company, role);
      usingApollo = true;
      console.log(`Apollo.io: Found ${recruiters.length} recruiters and ${domainEmployees.length} domain employees`);
      
      // If Apollo returned very few results, try Hunter.io as supplement
      if ((recruiters.length + domainEmployees.length) < 3 && domain && process.env.HUNTER_API_KEY) {
        console.log('Apollo.io returned few results, supplementing with Hunter.io...');
        try {
          const hunterRecruiters = await hunterSearchRecruiters(domain);
          const hunterEmployees = await hunterSearchDomainEmployees(domain, role);
          
          // Merge results (avoid duplicates by email)
          const existingEmails = new Set([
            ...recruiters.map(r => r.email?.toLowerCase()),
            ...domainEmployees.map(e => e.email?.toLowerCase()),
          ]);
          
          const newRecruiters = hunterRecruiters.filter(r => 
            r.email && !existingEmails.has(r.email.toLowerCase())
          );
          const newEmployees = hunterEmployees.filter(e => 
            e.email && !existingEmails.has(e.email.toLowerCase())
          );
          
          recruiters = [...recruiters, ...newRecruiters];
          domainEmployees = [...domainEmployees, ...newEmployees];
          console.log(`After Hunter.io supplement: ${recruiters.length} recruiters and ${domainEmployees.length} domain employees`);
        } catch (hunterError: any) {
          console.warn('Hunter.io supplement failed:', hunterError.message);
        }
      }
    } catch (apolloError: any) {
      console.warn('Apollo.io search failed:', apolloError.message);
      
      // Check if it's an authentication error
      if (apolloError.message.includes('401') || apolloError.message.includes('Invalid access credentials')) {
        console.warn('Apollo.io API key appears invalid. Check your APOLLO_API_KEY in .env.local');
      }
      
      // Fallback to Hunter.io if Apollo fails
      if (domain && process.env.HUNTER_API_KEY) {
        try {
          console.log('Falling back to Hunter.io...');
          recruiters = await hunterSearchRecruiters(domain);
          domainEmployees = await hunterSearchDomainEmployees(domain, role);
          console.log(`Hunter.io: Found ${recruiters.length} recruiters and ${domainEmployees.length} domain employees`);
        } catch (hunterError: any) {
          console.error('Hunter.io also failed:', hunterError.message);
          // Don't throw - return empty arrays so user still sees company info
          recruiters = [];
          domainEmployees = [];
        }
      } else {
        // No fallback available - but don't fail completely
        console.warn('No Hunter.io API key set. Only Apollo.io results will be shown.');
        recruiters = [];
        domainEmployees = [];
        
        // Only return error if it's not a free tier limitation
        if (!apolloError.message.includes('free plan') && !apolloError.message.includes('not accessible')) {
          // For auth errors, still allow the search to continue with empty results
          if (apolloError.message.includes('401') || apolloError.message.includes('Invalid access credentials')) {
            console.warn('Apollo.io authentication failed. Please check your API key.');
          }
        }
      }
    }

    // 4. Format company data
    const companyResult = {
      id: companyData.id || `company-${Date.now()}`,
      name: companyData.name || company,
      domain: companyData.primary_domain || companyData.domain || companyData.website_url || extractDomain(company),
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
      .map(contact => formatContact(contact, usingApollo ? 'apollo' : 'hunter'));
    
    const formattedDomainEmployees = domainEmployees
      .filter(contact => contact.email || contact.full_name || contact.name) // Only include contacts with at least email or name
      .map(contact => formatContact(contact, usingApollo ? 'apollo' : 'hunter'));

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
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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
  if (!title) return 50;
  
  const titleLower = title.toLowerCase();
  const roleLower = role.toLowerCase();
  
  // Exact match = 100
  if (titleLower.includes(roleLower)) return 100;
  
  // Related roles = 70-90
  const relatedRoles: Record<string, string[]> = {
    'data scientist': ['ml engineer', 'machine learning', 'data science'],
    'software engineer': ['developer', 'programmer', 'engineer'],
  };
  
  const related = relatedRoles[roleLower];
  if (related) {
    const match = related.find(r => titleLower.includes(r));
    if (match) return 80;
  }
  
  // Default
  return 50;
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

