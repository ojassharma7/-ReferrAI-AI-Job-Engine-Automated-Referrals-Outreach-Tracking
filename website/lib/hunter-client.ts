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
    limit: '10', // Free/Starter plan limit is 10
  });

  if (department) {
    params.append('department', department);
  }

  const url = `${HUNTER_BASE_URL}/domain-search?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [] }));
      
      // Check if it's just a pagination limit warning (we can still use the results)
      const isLimitError = errorData.errors?.some((e: any) => 
        e.code === 400 && e.details?.includes('limited to 10')
      );
      
      if (isLimitError && response.status === 400) {
        // Try to parse partial results if available
        const partialData = await response.json().catch(() => null);
        if (partialData?.data?.emails) {
          // Return what we have despite the limit warning
          const contacts: HunterContact[] = (partialData.data.emails || []).map((email: any) => ({
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
      }
      
      const error = JSON.stringify(errorData);
      throw new Error(`Hunter.io API error (${response.status}): ${error}`);
    }

    const data = await response.json();

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
  const contacts = await searchContactsByDomain(domain, 'hr');
  
  // Filter for recruiter titles
  return contacts.filter(contact => {
    const titleLower = contact.title.toLowerCase();
    return titleLower.includes('recruiter') ||
           titleLower.includes('talent') ||
           titleLower.includes('hiring') ||
           titleLower.includes('hr manager');
  });
}

/**
 * Search for domain-specific employees
 */
export async function searchDomainEmployees(
  domain: string,
  role: string
): Promise<HunterContact[]> {
  const contacts = await searchContactsByDomain(domain);
  
  // Filter by role
  return contacts.filter(contact => {
    const titleLower = contact.title.toLowerCase();
    const roleLower = role.toLowerCase();
    
    // Exact match
    if (titleLower.includes(roleLower)) return true;
    
    // Related roles
    const relatedRoles: Record<string, string[]> = {
      'data scientist': ['ml engineer', 'machine learning', 'data science'],
      'software engineer': ['developer', 'programmer', 'engineer'],
    };
    
    const related = relatedRoles[roleLower];
    if (related) {
      return related.some(r => titleLower.includes(r));
    }
    
    return false;
  });
}

