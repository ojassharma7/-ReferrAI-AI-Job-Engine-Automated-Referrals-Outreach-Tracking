// Job search client using JSearch API (RapidAPI)
// Alternative: Can be extended to use other APIs (Adzuna, SerpAPI, etc.)

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;
const JSEARCH_BASE_URL = 'https://jsearch.p.rapidapi.com';

export interface JobSearchResult {
  job_id: string;
  employer_name: string;
  employer_logo?: string;
  job_title: string;
  job_description?: string;
  job_employment_type?: string;
  job_apply_link?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_posted_at_datetime_utc?: string;
  job_google_link?: string;
}

export interface JobSearchResponse {
  data: JobSearchResult[];
  parameters: {
    query: string;
    page?: number;
    num_pages?: number;
  };
  status: string;
}

/**
 * Search for jobs using JSearch API
 * @param company Company name
 * @param role Job role/title
 * @param location Optional location filter
 */
export async function searchJobs(
  company: string,
  role: string,
  location?: string
): Promise<JobSearchResult[]> {
  if (!JSEARCH_API_KEY) {
    console.warn('JSEARCH_API_KEY not set, skipping job search');
    return [];
  }

  try {
    // Build query: "Software Engineer at Google" or "Data Scientist Google"
    const query = location
      ? `${role} at ${company} in ${location}`
      : `${role} at ${company}`;

    const url = `${JSEARCH_BASE_URL}/search?query=${encodeURIComponent(query)}&page=1&num_pages=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': JSEARCH_API_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`JSearch API error (${response.status}):`, errorText);
      throw new Error(`Job search failed: ${response.status}`);
    }

    const data: JobSearchResponse = await response.json();

    if (data.status === 'OK' && data.data) {
      // Filter results to match the company name (case-insensitive)
      const companyLower = company.toLowerCase();
      const filteredJobs = data.data.filter((job) => {
        const employerName = job.employer_name?.toLowerCase() || '';
        const jobTitle = job.job_title?.toLowerCase() || '';
        const description = job.job_description?.toLowerCase() || '';

        return (
          employerName.includes(companyLower) ||
          description.includes(companyLower) ||
          (jobTitle.includes(role.toLowerCase()) &&
            description.includes(companyLower))
        );
      });

      return filteredJobs;
    }

    return [];
  } catch (error: any) {
    console.error('Error searching jobs:', error);
    // Return empty array on error (graceful degradation)
    return [];
  }
}

/**
 * Alternative: Search using Adzuna API (if JSearch is not available)
 * This is a placeholder for future implementation
 */
export async function searchJobsAdzuna(
  company: string,
  role: string,
  location?: string
): Promise<JobSearchResult[]> {
  // TODO: Implement Adzuna API integration
  // Adzuna API: https://developer.adzuna.com/
  return [];
}

