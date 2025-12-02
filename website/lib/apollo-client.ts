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
  const searchParams: any = {
    q_organization_name: companyName,
    person_titles: getRoleKeywords(role),
    page: 1,
    per_page: 100,
  };

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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY, // API key in header
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apollo.io API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Apollo.io returns data in 'people' field
    return {
      contacts: data.people || [],
      pagination: data.pagination || {
        page: 1,
        per_page: 100,
        total_entries: 0,
        total_pages: 0,
      },
    };
  } catch (error: any) {
    console.error('Apollo.io API error:', error);
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
  const response = await searchContacts(companyName, 'recruiter', {
    department: ['hr', 'recruiting', 'talent'],
    emailStatus: ['verified', 'likely'],
  });

  return response.contacts.filter(contact => 
    isRecruiter(contact.title)
  );
}

/**
 * Search for domain-specific employees
 */
export async function searchDomainEmployees(
  companyName: string,
  role: string
): Promise<ApolloContact[]> {
  const response = await searchContacts(companyName, role, {
    emailStatus: ['verified', 'likely'],
  });

  return response.contacts.filter(contact =>
    matchesRole(contact.title, role)
  );
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

