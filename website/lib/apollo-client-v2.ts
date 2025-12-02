// Apollo.io API Client - Alternative Implementation
// Using GraphQL API or REST endpoints available on free tier

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

/**
 * Test API key access
 */
export async function testApolloAPIKey(): Promise<boolean> {
  if (!APOLLO_API_KEY) {
    throw new Error('APOLLO_API_KEY is not set');
  }

  // Try to access a basic endpoint to test the key
  const url = `${APOLLO_BASE_URL}/auth/health`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': APOLLO_API_KEY,
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Search for contacts - Try multiple endpoints
 */
export async function searchContacts(
  companyName: string,
  role: string
): Promise<ApolloContact[]> {
  if (!APOLLO_API_KEY) {
    throw new Error('APOLLO_API_KEY is not set');
  }

  // Try different endpoints that might be available on free tier
  const endpoints = [
    '/mixed_people/search',
    '/people/search',
    '/contacts/search',
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${APOLLO_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_API_KEY,
        },
        body: JSON.stringify({
          q_organization_name: companyName,
          person_titles: getRoleKeywords(role),
          per_page: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.people || data.contacts || [];
      }
    } catch (error) {
      // Try next endpoint
      continue;
    }
  }

  throw new Error('No accessible endpoints found. Free tier may have limited API access. Consider upgrading or using alternative approach.');
}

/**
 * Get role keywords for search
 */
function getRoleKeywords(role: string): string[] {
  const roleLower = role.toLowerCase();
  
  const roleMap: Record<string, string[]> = {
    'data scientist': ['Data Scientist', 'ML Engineer', 'Machine Learning Engineer'],
    'software engineer': ['Software Engineer', 'Software Developer', 'Full Stack Developer'],
    'product manager': ['Product Manager', 'Product Owner'],
    'recruiter': ['Recruiter', 'Talent Acquisition', 'Hiring Manager'],
  };

  for (const [key, keywords] of Object.entries(roleMap)) {
    if (roleLower.includes(key)) {
      return keywords;
    }
  }

  return [role];
}

