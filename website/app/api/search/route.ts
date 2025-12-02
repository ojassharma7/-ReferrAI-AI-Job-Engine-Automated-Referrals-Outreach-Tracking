// API Route: Search for contacts and jobs

import { NextRequest, NextResponse } from 'next/server';
import { searchRecruiters as apolloSearchRecruiters, searchDomainEmployees as apolloSearchDomainEmployees, lookupCompany } from '@/lib/apollo-client';
import { searchRecruiters as hunterSearchRecruiters, searchDomainEmployees as hunterSearchDomainEmployees } from '@/lib/hunter-client';
import { SearchResult } from '@/lib/types';

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
    try {
      recruiters = await apolloSearchRecruiters(company);
      domainEmployees = await apolloSearchDomainEmployees(company, role);
    } catch (apolloError: any) {
      console.warn('Apollo.io search not accessible, trying Hunter.io:', apolloError.message);
      
      // Fallback to Hunter.io if Apollo fails
      if (domain && process.env.HUNTER_API_KEY) {
        try {
          recruiters = await hunterSearchRecruiters(domain);
          domainEmployees = await hunterSearchDomainEmployees(domain, role);
        } catch (hunterError: any) {
          console.error('Hunter.io also failed:', hunterError.message);
          throw new Error(`Both Apollo.io and Hunter.io failed. Apollo: ${apolloError.message}. Hunter: ${hunterError.message}`);
        }
      } else {
        // No fallback available
        if (apolloError.message.includes('free plan') || apolloError.message.includes('not accessible')) {
          return NextResponse.json(
            { 
              error: 'Apollo.io search endpoints are not available on the free plan. Please set HUNTER_API_KEY in .env for fallback, or upgrade your Apollo.io plan.',
              errorCode: 'APOLLO_UPGRADE_REQUIRED',
              suggestion: 'Add HUNTER_API_KEY to your .env file to use Hunter.io as a fallback.',
            },
            { status: 403 }
          );
        }
        throw apolloError;
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

    // 5. Format contacts helper
    const formatContact = (contact: any) => ({
      id: contact.id || contact.contact_id || `contact-${Date.now()}-${Math.random()}`,
      company_id: companyResult.id,
      email: contact.email,
      full_name: contact.full_name || contact.name || `${contact.first_name} ${contact.last_name}`,
      first_name: contact.first_name,
      last_name: contact.last_name,
      title: contact.title,
      department: contact.department || contact.team_function,
      seniority: inferSeniority(contact.title),
      linkedin_url: contact.linkedin_url,
      phone: contact.phone_number || contact.phone,
      email_verified: contact.email_status === 'verified' || contact.verified_status === 'valid',
      email_status: contact.email_status || contact.verified_status || 'unknown',
      relevance_score: calculateRelevanceScore(contact.title, role),
      source: contact.source || 'apollo',
    });

    const formattedRecruiters = recruiters.map(formatContact);
    const formattedDomainEmployees = domainEmployees.map(formatContact);

    // 6. Build response
    const result: SearchResult = {
      company: companyResult,
      recruiters: formattedRecruiters,
      domainEmployees: formattedDomainEmployees,
      jobs: [], // TODO: Add job search integration
      totalContacts: formattedRecruiters.length + formattedDomainEmployees.length,
      totalJobs: 0,
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

