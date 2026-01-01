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
  
  const roleLower = role.toLowerCase();
  
  // Define role-specific keywords for better matching
  const roleKeywords: Record<string, string[]> = {
    'data scientist': ['data scientist', 'data science', 'ml engineer', 'machine learning engineer', 'machine learning', 'ai engineer', 'data engineer', 'data analyst', 'research scientist', 'applied scientist'],
    'software engineer': ['software engineer', 'software developer', 'developer', 'programmer', 'backend engineer', 'frontend engineer', 'full stack', 'engineer', 'sde'],
    'product manager': ['product manager', 'product owner', 'pm', 'technical product manager'],
    'data analyst': ['data analyst', 'business analyst', 'analyst', 'analytics'],
  };
  
  // Get relevant keywords for this role
  const relevantKeywords = roleKeywords[roleLower] || [roleLower];
  
  // Filter by role - be strict about matching
  const filtered = contacts.filter(contact => {
    const titleLower = (contact.title || '').toLowerCase();
    
    // Skip recruiters/HR (they're handled separately)
    if (titleLower.includes('recruiter') || titleLower.includes('talent') || titleLower.includes('hr') || 
        titleLower.includes('hiring') || titleLower.includes('people operations')) {
      return false;
    }
    
    // Skip non-technical roles when searching for technical roles
    const nonTechnicalRoles = ['administrative', 'assistant', 'executive', 'head', 'business operations', 'sales', 'marketing', 'finance'];
    const isTechnicalRole = relevantKeywords.some(kw => 
      kw.includes('engineer') || kw.includes('scientist') || kw.includes('developer') || kw.includes('analyst')
    );
    
    if (isTechnicalRole) {
      const hasNonTechnicalKeyword = nonTechnicalRoles.some(ntr => titleLower.includes(ntr));
      if (hasNonTechnicalKeyword && !titleLower.includes('engineer') && !titleLower.includes('scientist') && !titleLower.includes('developer')) {
        return false;
      }
    }
    
    // Check if title matches any of the relevant keywords
    const matchesRole = relevantKeywords.some(keyword => titleLower.includes(keyword));
    
    return matchesRole;
  });
  
  console.log(`Filtered ${contacts.length} contacts to ${filtered.length} matching role "${role}"`);
  
  // Only return filtered results - don't fallback to non-matching contacts
  return filtered;
}

