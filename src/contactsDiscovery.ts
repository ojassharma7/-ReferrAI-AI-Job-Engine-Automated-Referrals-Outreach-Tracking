// Contact discovery via Hunter.io and Jobrights.io

import { JobRow, VerifiedStatus } from './types';
import { logWarn, logError, logInfo } from './logger';

export interface DiscoveredContactRaw {
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  linkedin_url?: string;
  source?: 'hunter' | 'jobrights';
  verified_status?: VerifiedStatus;
}

/**
 * Discover contacts from Hunter.io using domain-search endpoint
 * Reference: https://api.hunter.io/v2/domain-search
 */
async function discoverFromHunter(job: JobRow): Promise<DiscoveredContactRaw[]> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const domain = job.domain;
    if (!domain) {
      logWarn(`No domain for job ${job.job_id}, skipping Hunter.io`);
      return [];
    }

    // Hunter.io domain-search endpoint - searches for all emails at a domain
    // We can filter by department, seniority, etc.
    // Reference: https://api.hunter.io/v2/domain-search
    // Note: Free/Starter plans may limit results to 10 emails
    const params = new URLSearchParams({
      domain: domain,
      api_key: apiKey,
      limit: '10', // Start with 10 to avoid plan limit errors (can be increased for paid plans)
      // Filter by departments relevant to hiring/recruiting
      department: 'hr',
    });

    // Add additional department filters if needed
    // Note: Hunter.io may support multiple department params or a single one
    const url = `https://api.hunter.io/v2/domain-search?${params.toString()}`;

    logInfo(`Calling Hunter.io domain-search for ${domain}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      logWarn(`Hunter.io API error (${response.status}): ${errorText}`);
      return [];
    }

    const data = await response.json();
    const contacts: DiscoveredContactRaw[] = [];
    const allTitles: string[] = [];

    // Hunter.io domain-search response structure:
    // data.emails[] - array of email objects
    // Each email has: value, first_name, last_name, position, linkedin_url, verification, etc.
    if (data.data && data.data.emails && Array.isArray(data.data.emails)) {
      for (const emailData of data.data.emails) {
        // Filter by relevant titles/positions
        const title = (emailData.position || '').toLowerCase();
        if (emailData.position) {
          allTitles.push(emailData.position);
        }
        
        const relevantTitles = [
          'recruiter',
          'talent',
          'acquisition',
          'hr',
          'human resources',
          'people',
          'people ops',
          'hiring',
          'manager',
          'director',
          'head',
          'vp',
          'vice president',
          'lead',
        ];

        const isRelevant = relevantTitles.some((rt) => title.includes(rt));
        if (!isRelevant) {
          continue;
        }

        // Map verification status
        let verifiedStatus: VerifiedStatus = 'unknown';
        if (emailData.verification) {
          if (emailData.verification.status === 'valid') {
            verifiedStatus = 'verified';
          } else if (emailData.verification.status === 'accept_all') {
            verifiedStatus = 'guessed';
          }
        }

        contacts.push({
          email: emailData.value || emailData.email || '',
          full_name:
            emailData.first_name && emailData.last_name
              ? `${emailData.first_name} ${emailData.last_name}`
              : emailData.first_name || emailData.last_name || '',
          first_name: emailData.first_name || '',
          last_name: emailData.last_name || '',
          title: emailData.position || '',
          linkedin_url: emailData.linkedin_url || emailData.linkedin || '',
          source: 'hunter',
          verified_status: verifiedStatus,
        });
      }
    }

    const totalEmails = data.data?.emails?.length || 0;
    if (totalEmails > 0 && contacts.length === 0) {
      logWarn(`Hunter.io: Found ${totalEmails} emails but none matched relevant titles. Sample titles found: ${allTitles.slice(0, 5).join(', ') || 'none'}`);
    } else {
      logInfo(`Hunter.io: Found ${contacts.length} relevant contacts for ${domain} (out of ${totalEmails} total)`);
    }
    return contacts;
  } catch (error) {
    logError('Error calling Hunter.io API:', error);
    return [];
  }
}

/**
 * Discover contacts from Jobrights.io
 * Note: Adjust this based on actual Jobrights API structure
 */
async function discoverFromJobrights(
  job: JobRow,
): Promise<DiscoveredContactRaw[]> {
  const apiKey = process.env.JOBRIGHTS_API_KEY;
  const baseUrl = process.env.JOBRIGHTS_BASE_URL || 'https://api.jobrights.io';

  if (!apiKey) {
    return [];
  }

  try {
    // Adjust endpoint based on actual Jobrights API
    const url = `${baseUrl}/v1/contacts?company=${encodeURIComponent(job.company)}&domain=${encodeURIComponent(job.domain)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logWarn(`Jobrights API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const contacts: DiscoveredContactRaw[] = [];

    // Adjust based on actual Jobrights response structure
    if (data.contacts || data.data) {
      const contactList = data.contacts || data.data || [];
      for (const contactData of contactList) {
        // Filter by relevant titles
        const title = (contactData.title || contactData.role || '').toLowerCase();
        const relevantTitles = [
          'recruiter',
          'talent',
          'hr',
          'people',
          'hiring',
          'manager',
          'director',
          'head',
          'vp',
        ];

        if (!relevantTitles.some((rt) => title.includes(rt))) {
          continue;
        }

        contacts.push({
          email: contactData.email,
          full_name: contactData.full_name || contactData.name || '',
          first_name: contactData.first_name || '',
          last_name: contactData.last_name || '',
          title: contactData.title || contactData.role || '',
          linkedin_url: contactData.linkedin_url || contactData.linkedin || '',
          source: 'jobrights',
          verified_status: contactData.verified ? 'verified' : 'unknown',
        });
      }
    }

    logInfo(`Jobrights: Found ${contacts.length} contacts for ${job.company}`);
    return contacts;
  } catch (error) {
    logError('Error calling Jobrights API:', error);
    return [];
  }
}

/**
 * Discover contacts for a job using Hunter.io and Jobrights.io
 * Returns stubbed contacts if APIs are not configured
 */
export async function discoverContactsForJob(
  job: JobRow,
): Promise<DiscoveredContactRaw[]> {
  const hunterContacts = await discoverFromHunter(job);
  const jobrightsContacts = await discoverFromJobrights(job);

  const allContacts = [...hunterContacts, ...jobrightsContacts];

  // If no contacts found and APIs are configured, return empty
  // If APIs are not configured, return stubbed contacts for testing
  if (allContacts.length === 0) {
    const hasHunterKey = !!process.env.HUNTER_API_KEY;
    const hasJobrightsKey = !!process.env.JOBRIGHTS_API_KEY;

    if (!hasHunterKey && !hasJobrightsKey) {
      logWarn('No contact discovery APIs configured, using stubbed contacts');
      // Return stubbed contacts for testing
      return [
        {
          email: 'priya@xyz.com',
          full_name: 'Priya Kapoor',
          first_name: 'Priya',
          last_name: 'Kapoor',
          title: 'Director, Talent Acquisition',
          source: 'hunter',
          verified_status: 'verified',
        },
        {
          email: 'maya.lee@xyz.com',
          full_name: 'Maya Lee',
          first_name: 'Maya',
          last_name: 'Lee',
          title: 'VP, Data Science',
          source: 'hunter',
          verified_status: 'guessed',
        },
      ];
    } else {
      logWarn(`No contacts discovered for job ${job.job_id}`);
      return [];
    }
  }

  return allContacts;
}

