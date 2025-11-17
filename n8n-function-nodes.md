# n8n Function Node Code Snippets

Copy-paste ready JavaScript code for n8n Function nodes. No imports required.

## 1. PrepareReferralEmailInput

**Purpose:** Build system and user prompts for Gemini referral email generation

**Input:** `items[0].json` containing `job`, `contact`, and `jd_insights`

**Output:** `{ systemPrompt, userPrompt }`

```javascript
// n8n Function Node: PrepareReferralEmailInput
const item = items[0].json;
const job = item.job;
const contact = item.contact;
const jdInsights = item.jd_insights || item.jdInsights;

const candidateProfile = 'Ojas Sharma — data scientist with credit risk background.';
const proofPoint = 'Detected 13% more high-risk gamblers via unsupervised clustering.';

const systemPrompt = `You are Ojas, a data professional requesting referrals. Write concise, respectful outreach emails that sound human. Always respond ONLY with valid JSON in the form {"subject_a":"","subject_b":"","body":""}. Do not add explanations or extra keys. Emails must be truthful and aligned with the provided profile and job.`;

const userPrompt = `Candidate profile:
${candidateProfile}

Job details:
- Company: ${job.company}
- Title: ${job.job_title}
- Location: ${job.job_location}
- Job Family: ${job.job_family}
- URL: ${job.job_url}

JD insights:
- Keywords: ${(jdInsights.jd_keywords || []).join(', ')}
- Top Requirements: ${(jdInsights.top_requirements || []).join('; ')}
- Nice to Have: ${(jdInsights.nice_to_have || []).join('; ')}

Contact:
- Name: ${contact.full_name}
- Title: ${contact.title}
- Seniority: ${contact.seniority}

Proof point (must appear in body verbatim or paraphrased with metric):
${proofPoint}

Constraints:
- 3 to 4 sentences total.
- Include exactly one quantified proof point tied to the job.
- Make one specific ask (referral, internal forward, or short call).
- End with a polite opt-out line.
- Tone: concise, confident, respectful, sounds like a real person.

Return JSON only:
{"subject_a":"","subject_b":"","body":""}`;

return [{
  json: {
    ...item,
    systemPrompt: systemPrompt,
    userPrompt: userPrompt
  }
}];
```

## 2. HandleGeminiReferralResponse

**Purpose:** Parse Gemini LLM response and extract email content

**Input:** `items[0].json` with LLM raw text (string) from Gemini node

**Output:** `{ subject_a, subject_b, body }`

```javascript
// n8n Function Node: HandleGeminiReferralResponse
const item = items[0].json;

// Get the LLM response - adjust path based on your Gemini node output structure
const rawResponse = item.response || item.text || item.output || item.json?.response || item.json?.text || '';

if (!rawResponse || typeof rawResponse !== 'string') {
  throw new Error('No valid LLM response found. Expected string in response/text/output field.');
}

// Try to extract JSON from the response (handle markdown code blocks, etc.)
let jsonStr = rawResponse.trim();

// Remove markdown code blocks if present
jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

// Try to find JSON object in the string
let jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  jsonStr = jsonMatch[0];
}

let parsed;
try {
  parsed = JSON.parse(jsonStr);
} catch (e) {
  throw new Error(`Failed to parse JSON from Gemini response: ${e.message}. Raw response: ${rawResponse.substring(0, 200)}`);
}

// Validate required fields
if (!parsed.subject_a || !parsed.subject_b || !parsed.body) {
  throw new Error(`Missing required fields in parsed JSON. Got: ${Object.keys(parsed).join(', ')}. Expected: subject_a, subject_b, body`);
}

return [{
  json: {
    ...item,
    subject_a: parsed.subject_a,
    subject_b: parsed.subject_b,
    body: parsed.body
  }
}];
```

## 3. BuildGmailPayload

**Purpose:** Format email data for Gmail node

**Input:** `items[0].json` with `contact`, `job`, and `emailContent` (or `subject_a`, `subject_b`, `body`)

**Output:** `{ to, subject, body }` ready for Gmail node

```javascript
// n8n Function Node: BuildGmailPayload
const item = items[0].json;
const contact = item.contact;
const job = item.job;

// Get email content - support multiple input formats
const emailContent = item.emailContent || item;
const subject_a = emailContent.subject_a || item.subject_a;
const subject_b = emailContent.subject_b || item.subject_b;
const body = emailContent.body || item.body;

if (!contact || !contact.email) {
  throw new Error('Missing contact or contact.email');
}

if (!subject_a || !subject_b || !body) {
  throw new Error('Missing email content. Need subject_a, subject_b, and body');
}

// Choose subject (default to subject_b, but you can add logic to pick A or B)
const subjectUsed = item.subject_used || 'subject_b';
const subject = subjectUsed === 'subject_a' ? subject_a : subject_b;

return [{
  json: {
    ...item,
    to: contact.email,
    subject: subject,
    body: body,
    // Keep original data for logging
    contact: contact,
    job: job,
    subject_a: subject_a,
    subject_b: subject_b,
    subject_used: subjectUsed
  }
}];
```

## Usage in n8n Workflow

1. **PrepareReferralEmailInput** → placed after loading job/contact data
2. **Gemini LLM Node** → uses `systemPrompt` and `userPrompt` from previous node
3. **HandleGeminiReferralResponse** → placed after Gemini node to parse response
4. **BuildGmailPayload** → formats for Gmail node
5. **Gmail Node** → uses `to`, `subject`, `body` from previous node

