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
      source: 'hunter',
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
  
  // Filter for recruiter titles - strict matching
  const recruiterKeywords = ['recruiter', 'talent acquisition', 'hiring manager', 'hr partner', 'people operations'];
  const filtered = contacts.filter(contact => {
    const titleLower = (contact.title || '').toLowerCase();
    return recruiterKeywords.some(keyword => titleLower.includes(keyword));
  });
  
  return filtered;
}

/**
 * Search for domain-specific employees - STRICT FILTERING
 */
export async function searchDomainEmployees(
  domain: string,
  role: string
): Promise<HunterContact[]> {
  const contacts = await searchContactsByDomain(domain);
  
  if (contacts.length === 0) {
    console.log(`No contacts found for domain "${domain}"`);
    return [];
  }
  
  const roleLower = role.toLowerCase().trim();
  
  // STRICT role-specific keywords - only exact/close matches
  const roleKeywords: Record<string, string[]> = {
    'data scientist': [
      'data scientist', 'data science', 'ml engineer', 'machine learning engineer', 
      'machine learning', 'ai engineer', 'research scientist', 'applied scientist',
      'statistician', 'quantitative analyst'
    ],
    'software engineer': [
      'software engineer', 'software developer', 'backend engineer', 'frontend engineer',
      'full stack engineer', 'fullstack engineer', 'sde', 'software development engineer',
      'systems engineer', 'application engineer', 'platform engineer', 'devops engineer'
    ],
    'product manager': [
      'product manager', 'product owner', 'technical product manager', 'product lead'
    ],
    'data analyst': [
      'data analyst', 'business analyst', 'data analytics', 'analytics engineer'
    ],
  };
  
  // Get relevant keywords - if role not found, use role itself
  const relevantKeywords = roleKeywords[roleLower] || [roleLower];
  
  // Always exclude these - never return them
  const alwaysExclude = [
    'recruiter', 'talent acquisition', 'hiring', 'hr partner', 'hr manager', 
    'people operations', 'administrative assistant', 'executive assistant',
    'executive recruiter', 'headhunter', 'sourcer', 'executive', 'head of',
    'director of', 'manager of', 'operations support', 'business operations'
  ];
  
  // STRICT filtering - only return contacts that clearly match
  const filtered = contacts.filter(contact => {
    const titleLower = (contact.title || '').toLowerCase().trim();
    
    if (!titleLower) return false;
    
    // Always skip excluded roles
    if (alwaysExclude.some(excluded => titleLower.includes(excluded))) {
      return false;
    }
    
    // Skip generic titles without role keywords (e.g., just "Manager", "Director")
    const genericOnly = ['director', 'manager', 'executive', 'head', 'lead', 'senior', 'principal'];
    const isGenericOnly = genericOnly.some(gt => {
      const pattern = new RegExp(`^${gt}(\\s+of|\\s+$|$)`, 'i');
      return pattern.test(titleLower) && !relevantKeywords.some(kw => titleLower.includes(kw));
    });
    if (isGenericOnly) {
      return false;
    }
    
    // Must match one of the relevant keywords
    const matchesRole = relevantKeywords.some(keyword => {
      // Exact match or contains the keyword
      return titleLower.includes(keyword);
    });
    
    if (!matchesRole) return false;
    
    // For technical roles, exclude non-technical even if keyword matches
    const isTechnicalSearch = roleLower.includes('engineer') || roleLower.includes('scientist') || 
                               roleLower.includes('developer') || roleLower.includes('analyst');
    
    if (isTechnicalSearch) {
      const nonTechnicalKeywords = [
        'sales', 'marketing', 'finance', 'operations', 'business development',
        'account manager', 'customer success', 'business operations', 'strategy',
        'risk manager', 'support executive'
      ];
      
      const hasNonTechnical = nonTechnicalKeywords.some(nt => titleLower.includes(nt));
      if (hasNonTechnical) {
        // Only allow if clearly technical (e.g., "Sales Engineer" is OK)
        const hasTechnicalKeyword = titleLower.includes('engineer') || 
                                    titleLower.includes('scientist') || 
                                    titleLower.includes('developer') ||
                                    titleLower.includes('analyst');
        if (!hasTechnicalKeyword) {
          return false;
        }
      }
    }
    
    return true;
  });
  
  console.log(`✅ Filtered ${contacts.length} contacts → ${filtered.length} matching "${role}"`);
  
  // Return ONLY matching contacts - no fallback to random contacts
  return filtered;
}
