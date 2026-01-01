// Hunter.io API Client (Fallback/Alternative to Apollo.io)

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const HUNTER_BASE_URL = 'https://api.hunter.io/v2';

export interface HunterContact {
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  linkedin_url?: string;
  phone?: string;
  verified: boolean;
  confidence_score: number;
  source?: string;
}

export interface HunterSearchResponse {
  contacts: HunterContact[];
  total: number;
}

/**
 * Search for contacts using Hunter.io domain-search
 */
export async function searchContactsByDomain(
  domain: string,
  department?: string
): Promise<HunterContact[]> {
  if (!HUNTER_API_KEY) {
    throw new Error('HUNTER_API_KEY is not set');
  }

  const params = new URLSearchParams({
    domain: domain,
    api_key: HUNTER_API_KEY,
    limit: '10', // Free tier limit is 10 - use exactly 10 to avoid errors
  });

  if (department) {
    params.append('department', department);
  }

  const url = `${HUNTER_BASE_URL}/domain-search?${params.toString()}`;

  try {
    const response = await fetch(url);
    const responseText = await response.text();
    
    if (!response.ok) {
      // Try to parse the response - it might contain partial data even with errors
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Not JSON, can't parse
        throw new Error(`Hunter.io API error (${response.status}): ${responseText}`);
      }
      
      // Check if it's just a pagination limit warning (we can still use the results)
      const isLimitError = responseData.errors?.some((e: any) => 
        (e.code === 400) && 
        (e.details?.includes('limited to') || e.details?.includes('limited to 10'))
      );
      
      if (isLimitError && responseData.data?.emails && responseData.data.emails.length > 0) {
        // Return what we have despite the limit warning
        console.log(`⚠️ Hunter.io free tier limit reached, but returning ${responseData.data.emails.length} contacts`);
        const contacts: HunterContact[] = (responseData.data.emails || []).map((email: any) => ({
          email: email.value || email.email || '',
          first_name: email.first_name || '',
          last_name: email.last_name || '',
          full_name: email.first_name && email.last_name 
            ? `${email.first_name} ${email.last_name}` 
            : email.first_name || email.last_name || email.value?.split('@')[0] || 'Unknown',
          title: email.position || email.title || '',
          linkedin_url: email.linkedin || email.linkedin_url || undefined,
          phone: email.phone || email.phone_number || undefined,
          verified: email.verification?.status === 'valid' || email.verified === true,
          confidence_score: email.confidence || email.confidence_score || 0,
          source: 'hunter',
        }));
        return contacts;
      }
      
      const error = JSON.stringify(responseData);
      throw new Error(`Hunter.io API error (${response.status}): ${error}`);
    }

    const data = JSON.parse(responseText);

    // Format Hunter.io response to our contact format
    const contacts: HunterContact[] = (data.data?.emails || []).map((email: any) => ({
      email: email.value || email.email || '',
      first_name: email.first_name || '',
      last_name: email.last_name || '',
      full_name: email.first_name && email.last_name 
        ? `${email.first_name} ${email.last_name}` 
        : email.first_name || email.last_name || email.value?.split('@')[0] || 'Unknown',
      title: email.position || email.title || '',
      linkedin_url: email.linkedin || email.linkedin_url || undefined,
      phone: email.phone || email.phone_number || undefined,
      verified: email.verification?.status === 'valid' || email.verified === true,
      confidence_score: email.confidence || email.confidence_score || 0,
      source: 'hunter', // Add source for tracking
    }));

    return contacts;
  } catch (error: any) {
    console.error('Hunter.io API error:', error);
    throw new Error(`Failed to search contacts: ${error.message}`);
  }
}

/**
 * Search for recruiters at a company
 */
export async function searchRecruiters(domain: string): Promise<HunterContact[]> {
  const contacts = await searchContactsByDomain(domain);
  
  if (contacts.length === 0) return [];
  
  // Filter for recruiter titles - be more lenient
  const recruiterKeywords = ['recruiter', 'talent', 'hiring', 'hr', 'people', 'recruiting', 'acquisition'];
  const filtered = contacts.filter(contact => {
    const titleLower = (contact.title || '').toLowerCase();
    return recruiterKeywords.some(keyword => titleLower.includes(keyword));
  });
  
  // If no recruiters found, return first 2 contacts as potential contacts
  if (filtered.length === 0 && contacts.length > 0) {
    console.log('No recruiters found with strict filter, returning first 2 contacts');
    return contacts.slice(0, 2);
  }
  
  return filtered;
}

/**
 * Search for domain-specific employees
 */
export async function searchDomainEmployees(
  domain: string,
  role: string
): Promise<HunterContact[]> {
  const contacts = await searchContactsByDomain(domain);
  
  if (contacts.length === 0) return [];
  
  // Filter by role - be more lenient, return contacts that might be relevant
  const filtered = contacts.filter(contact => {
    const titleLower = (contact.title || '').toLowerCase();
    const roleLower = role.toLowerCase();
    
    // Skip recruiters/HR (they're handled separately)
    if (titleLower.includes('recruiter') || titleLower.includes('talent') || titleLower.includes('hr')) {
      return false;
    }
    
    // Exact match
    if (titleLower.includes(roleLower)) return true;
    
    // Related roles
    const relatedRoles: Record<string, string[]> = {
      'data scientist': ['ml engineer', 'machine learning', 'data science', 'data', 'analyst', 'ai engineer'],
      'software engineer': ['developer', 'programmer', 'engineer', 'software', 'engineer', 'tech'],
      'product manager': ['product', 'pm', 'manager'],
    };
    
    const related = relatedRoles[roleLower];
    if (related) {
      return related.some(r => titleLower.includes(r));
    }
    
    // If no specific match, return contacts with technical/managerial titles
    const technicalKeywords = ['engineer', 'developer', 'manager', 'director', 'lead', 'senior', 'principal'];
    return technicalKeywords.some(keyword => titleLower.includes(keyword));
  });
  
  // If no matches found, return all non-recruiter contacts (up to 5)
  if (filtered.length === 0) {
    console.log('No domain employees found with strict filter, returning all non-recruiter contacts');
    const nonRecruiters = contacts.filter(contact => {
      const titleLower = (contact.title || '').toLowerCase();
      return !titleLower.includes('recruiter') && !titleLower.includes('talent') && !titleLower.includes('hr');
    });
    return nonRecruiters.slice(0, 5);
  }
  
  return filtered;
}

