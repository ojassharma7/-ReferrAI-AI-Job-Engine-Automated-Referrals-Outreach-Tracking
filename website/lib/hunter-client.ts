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
    'data scientist': ['data scientist', 'data science', 'ml engineer', 'machine learning engineer', 'machine learning', 'ai engineer', 'data engineer', 'data analyst', 'research scientist', 'applied scientist', 'statistician', 'quantitative'],
    'software engineer': ['software engineer', 'software developer', 'developer', 'programmer', 'backend engineer', 'frontend engineer', 'full stack engineer', 'fullstack engineer', 'sde', 'engineer', 'architect', 'tech lead'],
    'product manager': ['product manager', 'product owner', 'pm', 'technical product manager', 'product lead'],
    'data analyst': ['data analyst', 'business analyst', 'analyst', 'analytics', 'data'],
  };
  
  // Get relevant keywords for this role
  const relevantKeywords = roleKeywords[roleLower] || [roleLower];
  
  // Always exclude these roles regardless of search
  const alwaysExclude = ['recruiter', 'talent acquisition', 'hiring', 'hr partner', 'hr manager', 'people operations', 'administrative assistant', 'executive assistant'];
  
  // Filter by role - balanced approach
  const filtered = contacts.filter(contact => {
    const titleLower = (contact.title || '').toLowerCase();
    
    // Always skip recruiters/HR/administrative
    if (alwaysExclude.some(excluded => titleLower.includes(excluded))) {
      return false;
    }
    
    // Check if title matches any of the relevant keywords
    const matchesRole = relevantKeywords.some(keyword => titleLower.includes(keyword));
    
    // For technical roles, also exclude clearly non-technical roles
    const isTechnicalSearch = roleLower.includes('engineer') || roleLower.includes('scientist') || roleLower.includes('developer') || roleLower.includes('analyst');
    if (isTechnicalSearch && matchesRole) {
      // Exclude non-technical roles even if they contain the keyword
      const nonTechnicalKeywords = ['sales', 'marketing', 'finance', 'operations', 'business development'];
      const hasNonTechnical = nonTechnicalKeywords.some(nt => titleLower.includes(nt));
      if (hasNonTechnical && !titleLower.includes('engineer') && !titleLower.includes('scientist') && !titleLower.includes('developer') && !titleLower.includes('analyst')) {
        return false;
      }
    }
    
    return matchesRole;
  });
  
  console.log(`Hunter.io returned ${contacts.length} contacts for domain "${domain}", filtered to ${filtered.length} matching role "${role}"`);
  
  // If we have very few results, explain the limitation
  if (filtered.length < 3 && contacts.length > 0) {
    console.warn(`⚠️ Hunter.io free tier returns the same ${contacts.length} contacts regardless of role. Only ${filtered.length} matched "${role}". Consider using Apollo.io for better role-specific filtering.`);
  }
  
  return filtered;
}

