// Graceful demo/mock data layer.
//
// When an external API key is missing (or still a placeholder), the
// corresponding client returns realistic sample data tagged as mock instead of
// throwing. This lets the whole product be explored before any keys are wired,
// and each client switches to live data automatically once a real key is set.

const PLACEHOLDER_FRAGMENTS = ['your_', 'your-', '_here', 'replace', 'changeme', 'xxx'];

export function hasLiveKey(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  if (v === '') return false;
  return !PLACEHOLDER_FRAGMENTS.some((f) => v.includes(f));
}

export const apolloLive = () => hasLiveKey(process.env.APOLLO_API_KEY);
export const hunterLive = () => hasLiveKey(process.env.HUNTER_API_KEY);
export const jsearchLive = () => hasLiveKey(process.env.JSEARCH_API_KEY);
export const adzunaLive = () =>
  hasLiveKey(process.env.ADZUNA_APP_ID) && hasLiveKey(process.env.ADZUNA_APP_KEY);
export const geminiLive = () => hasLiveKey(process.env.GEMINI_API_KEY);

// Used by /api/search to flag demo results to the UI.
export const contactsAreMock = () => !apolloLive() && !hunterLive();
export const jobsAreMock = () => !adzunaLive() && !jsearchLive();
export const generationIsMock = () => !geminiLive();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function mockDomain(company: string): string {
  const cleaned = company
    .toLowerCase()
    .trim()
    .replace(/\s+(inc|llc|corp|corporation|company|co)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '');
  return `${cleaned || 'company'}.com`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '');
}

const FIRST_NAMES = ['Ava', 'Liam', 'Maya', 'Noah', 'Priya', 'Diego', 'Chen', 'Sofia', 'Omar', 'Grace'];
const LAST_NAMES = ['Patel', 'Kim', 'Garcia', 'Okoro', 'Nguyen', 'Rossi', 'Cohen', 'Silva', 'Khan', 'Ross'];

function person(i: number) {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i * 3 + 1) % LAST_NAMES.length];
  return { first, last, full: `${first} ${last}` };
}

interface MockContactShape {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  full_name: string;
  title: string;
  email: string;
  email_status: 'verified' | 'likely' | 'guessed';
  verified: boolean;
  confidence_score: number;
  phone: string;
  phone_number: string;
  linkedin_url: string;
  organization_name: string;
  source: string;
}

function mockContact(
  i: number,
  title: string,
  company: string,
  opts: { verified?: boolean; phone?: boolean } = {},
): MockContactShape {
  const { first, last, full } = person(i);
  const domain = mockDomain(company);
  const email = `${slug(first)}.${slug(last)}@${domain}`;
  const verified = opts.verified ?? i % 2 === 0;
  return {
    id: `mock-${slug(company)}-${i}`,
    first_name: first,
    last_name: last,
    name: full,
    full_name: full,
    title,
    email,
    email_status: verified ? 'verified' : 'likely',
    verified,
    confidence_score: verified ? 96 : 78,
    phone: opts.phone ? '+1 (415) 555-0' + (100 + i) : '',
    phone_number: opts.phone ? '+1 (415) 555-0' + (100 + i) : '',
    linkedin_url: `https://www.linkedin.com/in/${slug(first)}-${slug(last)}`,
    organization_name: company,
    source: 'mock',
  };
}

// ---------------------------------------------------------------------------
// Mock generators
// ---------------------------------------------------------------------------
export function mockCompany(company: string) {
  return {
    id: `mock-company-${slug(company)}`,
    name: company,
    domain: mockDomain(company),
    primary_domain: mockDomain(company),
    industry: 'Technology',
    estimated_num_employees: 5000,
    primary_location: { city: 'San Francisco, CA' },
    website_url: `https://${mockDomain(company)}`,
    linkedin_url: `https://www.linkedin.com/company/${slug(company)}`,
  };
}

export function mockRecruiters(company: string): MockContactShape[] {
  return [
    mockContact(0, 'Technical Recruiter', company, { verified: true, phone: true }),
    mockContact(1, 'Senior Talent Acquisition Partner', company, { verified: true }),
    mockContact(2, 'University Recruiting Lead', company, { verified: false }),
  ];
}

export function mockDomainEmployees(company: string, role: string): MockContactShape[] {
  const r = role.trim() || 'Engineer';
  const titled = r.charAt(0).toUpperCase() + r.slice(1);
  return [
    mockContact(3, `Senior ${titled}`, company, { verified: true, phone: true }),
    mockContact(4, `${titled}`, company, { verified: true }),
    mockContact(5, `Staff ${titled}`, company, { verified: false }),
    mockContact(6, `${titled} II`, company, { verified: true }),
  ];
}

export function mockJobs(company: string, role: string) {
  const r = role.trim() || 'Engineer';
  const titled = r.charAt(0).toUpperCase() + r.slice(1);
  const base = (i: number, level: string) => ({
    job_id: `mock-job-${slug(company)}-${i}`,
    employer_name: company,
    job_title: `${level}${titled}`.trim(),
    job_description: `We're hiring a ${level}${titled} at ${company}. You'll work on high-impact projects, collaborate cross-functionally, and ship product to millions of users. Requirements: strong fundamentals, 3+ years of relevant experience, and excellent communication skills. (This is demo data — add JSEARCH_API_KEY for live postings.)`,
    job_employment_type: 'Full-time',
    job_apply_link: `https://${mockDomain(company)}/careers/${slug(titled)}-${i}`,
    job_city: 'San Francisco',
    job_state: 'CA',
    job_country: 'US',
    job_posted_at_datetime_utc: new Date(Date.now() - i * 86400000).toISOString(),
  });
  return [base(1, 'Senior '), base(2, ''), base(3, 'Staff ')];
}

// ---- Generation mocks (Gemini) ----
export function mockResume(baseResume: string, jobTitle: string, company: string): string {
  return `[DEMO RESUME — add GEMINI_API_KEY for AI tailoring]

Tailored for: ${jobTitle} @ ${company}

SUMMARY
Results-driven professional aligned to the ${jobTitle} role at ${company}. The lines below are reordered and rephrased from your master resume to emphasize the most relevant experience (no fabricated content).

${baseResume?.trim() || '(Your master resume content would be tailored here.)'}
`;
}

export function mockCoverLetter(jobTitle: string, company: string): string {
  return `[DEMO COVER LETTER — add GEMINI_API_KEY for AI generation]

Dear Hiring Team,

I'm excited to apply for the ${jobTitle} role at ${company}. My background maps closely to what you're looking for, and I'd welcome the chance to contribute. In previous roles I've delivered measurable impact and collaborated across teams to ship results.

I'd love to discuss how I can help ${company} reach its goals.

Best regards,
Your Name
`;
}

// ---- Pipeline board mocks (no Supabase) ----
export function mockApplications() {
  const day = 86_400_000;
  const mk = (
    i: number,
    status: string,
    company: string,
    title: string,
    contact: { full_name: string; title: string } | null,
  ) => ({
    id: `mock-app-${i}`,
    status,
    notes: null as string | null,
    created_at: new Date(Date.now() - i * 3 * day).toISOString(),
    updated_at: new Date(Date.now() - i * day).toISOString(),
    job: { title, company, location: 'Remote' },
    contact: contact
      ? { full_name: contact.full_name, title: contact.title, email: null as string | null }
      : null,
  });
  return [
    mk(1, 'saved', 'Stripe', 'Staff Backend Engineer', null),
    mk(6, 'saved', 'Vercel', 'Developer Advocate', null),
    mk(2, 'contacted', 'Airbnb', 'Senior Data Scientist', {
      full_name: 'Maya Kim',
      title: 'Data Science Manager',
    }),
    mk(3, 'replied', 'Notion', 'Product Engineer', {
      full_name: 'Liam Garcia',
      title: 'Engineering Manager',
    }),
    mk(4, 'referred', 'Figma', 'Frontend Engineer', {
      full_name: 'Priya Patel',
      title: 'Staff Engineer',
    }),
    mk(5, 'interview', 'Linear', 'Full-stack Engineer', {
      full_name: 'Diego Rossi',
      title: 'Senior Engineer',
    }),
  ];
}

// ---- Outreach sequence mocks (no Supabase) ----
export function mockSequences() {
  const day = 86_400_000;
  const iso = (ms: number) => new Date(ms).toISOString();
  const now = Date.now();
  return [
    {
      id: 'mock-seq-1',
      status: 'active' as const,
      contact_name: 'Maya Kim',
      contact_email: 'maya.kim@airbnb.com',
      contact_title: 'Data Science Manager',
      company: 'Airbnb',
      job_title: 'Senior Data Scientist',
      created_at: iso(now - 2 * day),
      updated_at: iso(now - 2 * day),
      steps: [
        { id: 'm1s1', step_no: 1, send_after_days: 0, subject: 'Quick question about the Senior Data Scientist role', body: 'Hi Maya, ...', status: 'sent' as const, scheduled_for: iso(now - 2 * day), sent_at: iso(now - 2 * day) },
        { id: 'm1s2', step_no: 2, send_after_days: 3, subject: 'Re: Senior Data Scientist', body: 'Hi Maya, just floating this back up...', status: 'pending' as const, scheduled_for: iso(now + 1 * day), sent_at: null },
        { id: 'm1s3', step_no: 3, send_after_days: 7, subject: 'Re: Senior Data Scientist', body: 'Last note from me...', status: 'pending' as const, scheduled_for: iso(now + 5 * day), sent_at: null },
      ],
    },
    {
      id: 'mock-seq-2',
      status: 'replied' as const,
      contact_name: 'Liam Garcia',
      contact_email: 'liam.garcia@notion.so',
      contact_title: 'Engineering Manager',
      company: 'Notion',
      job_title: 'Product Engineer',
      created_at: iso(now - 6 * day),
      updated_at: iso(now - 4 * day),
      steps: [
        { id: 'm2s1', step_no: 1, send_after_days: 0, subject: 'Quick question about the Product Engineer role', body: 'Hi Liam, ...', status: 'sent' as const, scheduled_for: iso(now - 6 * day), sent_at: iso(now - 6 * day) },
        { id: 'm2s2', step_no: 2, send_after_days: 3, subject: 'Re: Product Engineer', body: 'Hi Liam, ...', status: 'skipped' as const, scheduled_for: iso(now - 3 * day), sent_at: null },
        { id: 'm2s3', step_no: 3, send_after_days: 7, subject: 'Re: Product Engineer', body: 'Hi Liam, ...', status: 'skipped' as const, scheduled_for: iso(now + 1 * day), sent_at: null },
      ],
    },
  ];
}

export function mockReferralEmail(jobTitle: string, company: string, contactName: string) {
  const first = contactName.split(' ')[0] || 'there';
  return {
    subject_a: `Quick question about the ${jobTitle} role at ${company}`,
    subject_b: `${jobTitle} @ ${company} — would value your perspective`,
    body: `Hi ${first},\n\nI'm exploring the ${jobTitle} role at ${company} and your work caught my eye. I recently shipped a project that lifted a key metric ~20%, and I'd value a quick referral or a 10-minute chat. Totally understand if you're busy — no worries either way.\n\nThanks!\n(Demo email — add GEMINI_API_KEY for AI-personalized outreach.)`,
  };
}
