// Apollo.io API Client
// Note: Free tier may have limited endpoint access
// Check: https://docs.apollo.io/ for available endpoints

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_BASE_URL = 'https://api.apollo.io/v1';

export interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  email: string;
  email_status: 'verified' | 'likely' | 'guessed' | 'invalid';
  phone_number: string;
  linkedin_url: string;
  organization_name: string;
  organization_id: string;
}

export interface ApolloSearchResponse {
  contacts: ApolloContact[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

/**
 * Search for contacts using Apollo.io API
 * Documentation: https://docs.apollo.io/
 */
export async function searchContacts(
  companyName: string,
  role: string,
  filters?: {
    department?: string[];
    seniority?: string[];
    emailStatus?: string[];
  }
): Promise<ApolloSearchResponse> {
  if (!APOLLO_API_KEY) {
    throw new Error('APOLLO_API_KEY is not set. Please set it in your .env file.');
  }

  // Build search query - Apollo.io uses POST with JSON body
  // API key goes in header, not body
  const roleKeywords = role ? getRoleKeywords(role) : [];
  const searchParams: any = {
    q_organization_name: companyName,
    page: 1,
    per_page: 100, // Request up to 100 results
  };
  
  // Add person_titles filter if we have role keywords
  // Apollo.io accepts person_titles as an array
  if (roleKeywords.length > 0 && roleKeywords[0] !== '') {
    // Use all keywords as an array for broader matching
    searchParams.person_titles = roleKeywords;
  }

  // Add filters
  if (filters?.department) {
    searchParams.department = filters.department;
  }
  if (filters?.emailStatus) {
    searchParams.email_status = filters.emailStatus;
  }

  // Apollo.io API endpoint - Use people/search for free tier
  const url = `${APOLLO_BASE_URL}/people/search`;
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY, // API key in header
      },
      body: JSON.stringify(searchParams),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apollo.io API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Apollo.io API response structure can vary
    // Try multiple possible field names
    let contacts: any[] = [];
    if (data.people && Array.isArray(data.people)) {
      contacts = data.people;
    } else if (data.contacts && Array.isArray(data.contacts)) {
      contacts = data.contacts;
    } else if (Array.isArray(data)) {
      contacts = data;
    } else if (data.data?.people && Array.isArray(data.data.people)) {
      contacts = data.data.people;
    } else if (data.data?.contacts && Array.isArray(data.data.contacts)) {
      contacts = data.data.contacts;
    }
    
    // Log response structure for debugging
    console.log(`Apollo.io search response: Found ${contacts.length} contacts`);
    console.log('Response structure:', {
      hasPeople: !!data.people,
      hasContacts: !!data.contacts,
      isArray: Array.isArray(data),
      hasDataPeople: !!(data.data?.people),
      hasDataContacts: !!(data.data?.contacts),
      contactsFound: contacts.length,
      pagination: data.pagination || data.meta || data.pagination_metadata,
    });
    
    return {
      contacts: contacts,
      pagination: data.pagination || data.meta || data.pagination_metadata || {
        page: 1,
        per_page: 100,
        total_entries: contacts.length,
        total_pages: 1,
      },
    };
  } catch (error: any) {
    console.error('Apollo.io API error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Apollo.io API request timed out after 30 seconds');
    }
    throw new Error(`Failed to search contacts: ${error.message}`);
  }
}

/**
 * Get role keywords for search
 */
function getRoleKeywords(role: string): string[] {
  const roleLower = role.toLowerCase();
  
  // Map common roles to search keywords
  const roleMap: Record<string, string[]> = {
    'data scientist': ['Data Scientist', 'ML Engineer', 'Machine Learning Engineer', 'Data Science'],
    'software engineer': ['Software Engineer', 'Software Developer', 'Full Stack Developer', 'Backend Engineer', 'Frontend Engineer'],
    'product manager': ['Product Manager', 'Product Owner', 'Technical Product Manager'],
    'data analyst': ['Data Analyst', 'Business Analyst', 'Analytics'],
    'recruiter': ['Recruiter', 'Talent Acquisition', 'Hiring Manager', 'HR Manager'],
  };

  // Find matching role
  for (const [key, keywords] of Object.entries(roleMap)) {
    if (roleLower.includes(key)) {
      return keywords;
    }
  }

  // Default: return the role as-is
  return [role];
}

/**
 * Search for recruiters at a company
 */
export async function searchRecruiters(companyName: string): Promise<ApolloContact[]> {
  // Try with email status filter first
  let response = await searchContacts(companyName, 'recruiter', {
    emailStatus: ['verified', 'likely'],
  });

  console.log(`Apollo.io recruiter search: ${response.contacts.length} total contacts before filtering`);
  
  // If we got very few results, try without email status filter
  if (response.contacts.length < 3) {
    console.log('Got few results, trying without email status filter...');
    try {
      const relaxedResponse = await searchContacts(companyName, 'recruiter');
      if (relaxedResponse.contacts.length > response.contacts.length) {
        response = relaxedResponse;
        console.log(`Got ${response.contacts.length} contacts with relaxed filters`);
      }
    } catch (e) {
      console.log('Relaxed search failed, using original results');
    }
  }
  
  // Filter for recruiter roles
  const filtered = response.contacts.filter(contact => {
    const title = contact.title || '';
    const isRecruiterRole = isRecruiter(title);
    return isRecruiterRole && contact.email; // Must have email
  });
  
  console.log(`Apollo.io recruiter search: ${filtered.length} contacts after filtering`);
  
  // If we still have very few after filtering, try a broader search without role filter
  if (filtered.length < 2) {
    console.log('Very few recruiters found, trying broader search...');
    try {
      // Search without person_titles - just by company, then filter client-side
      const broadResponse = await searchContacts(companyName, '', {
        emailStatus: ['verified', 'likely'],
      });
      const broadFiltered = broadResponse.contacts.filter(contact => {
        const title = contact.title || '';
        return isRecruiter(title) && contact.email;
      });
      if (broadFiltered.length > filtered.length) {
        console.log(`Broader search found ${broadFiltered.length} recruiters`);
        return broadFiltered;
      }
    } catch (e) {
      console.log('Broader search failed:', e);
    }
  }
  
  return filtered;
}

/**
 * Search for domain-specific employees
 */
export async function searchDomainEmployees(
  companyName: string,
  role: string
): Promise<ApolloContact[]> {
  // Try with email status filter first
  let response = await searchContacts(companyName, role, {
    emailStatus: ['verified', 'likely'],
  });

  console.log(`Apollo.io domain employee search for role "${role}": ${response.contacts.length} total contacts before filtering`);
  
  // If we got very few results, try without email status filter
  if (response.contacts.length < 3) {
    console.log('Got few results, trying without email status filter...');
    try {
      const relaxedResponse = await searchContacts(companyName, role);
      if (relaxedResponse.contacts.length > response.contacts.length) {
        response = relaxedResponse;
        console.log(`Got ${response.contacts.length} contacts with relaxed filters`);
      }
    } catch (e) {
      console.log('Relaxed search failed, using original results');
    }
  }
  
  const filtered = response.contacts.filter(contact => {
    const matches = matchesRole(contact.title || '', role);
    return matches;
  });
  
  console.log(`Apollo.io domain employee search: ${filtered.length} contacts after filtering`);
  
  // If filtering removed too many, return at least some results (less strict filtering)
  if (filtered.length === 0 && response.contacts.length > 0) {
    console.log('All contacts filtered out, returning top 5 contacts with best title match');
    return response.contacts.slice(0, 5);
  }
  
  return filtered;
}

/**
 * Check if a title is a recruiter role
 */
function isRecruiter(title: string): boolean {
  const recruiterKeywords = [
    'recruiter',
    'talent acquisition',
    'hiring manager',
    'hr manager',
    'people operations',
    'recruiting coordinator',
    'talent',
    'sourcer',
  ];

  const titleLower = title.toLowerCase();
  return recruiterKeywords.some(keyword => titleLower.includes(keyword));
}

/**
 * Check if a title matches the role
 */
function matchesRole(title: string, role: string): boolean {
  const roleLower = role.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Exact match
  if (titleLower.includes(roleLower)) {
    return true;
  }

  // Related roles
  const relatedRoles: Record<string, string[]> = {
    'data scientist': ['ml engineer', 'machine learning', 'data science', 'ai engineer'],
    'software engineer': ['developer', 'programmer', 'engineer', 'software'],
  };

  const related = relatedRoles[roleLower];
  if (related) {
    return related.some(r => titleLower.includes(r));
  }

  return false;
}

/**
 * Lookup company information
 */
export async function lookupCompany(companyName: string) {
  if (!APOLLO_API_KEY) {
    throw new Error('APOLLO_API_KEY is not set');
  }

  const url = `${APOLLO_BASE_URL}/organizations/search`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APOLLO_API_KEY, // API key in header
      },
      body: JSON.stringify({
        q_name: companyName,
        per_page: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apollo.io API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.organizations?.[0] || null;
  } catch (error: any) {
    console.error('Apollo.io company lookup error:', error);
    throw new Error(`Failed to lookup company: ${error.message}`);
  }
}

