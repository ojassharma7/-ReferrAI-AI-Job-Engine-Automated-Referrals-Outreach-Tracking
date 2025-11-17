# ReferrAI

**AI-powered job referral and automated application engine**

ReferrAI is a fully automated referral-request workflow built with n8n, Gemini AI, and Google Sheets. It discovers relevant contacts (via Hunter.io and Jobrights.io), drafts personalized emails with Gemini, generates customized resumes and cover letters tailored to each job description, and sends them through Gmail while tracking responses.

## Project Structure

```
src/
├── types.ts                    # TypeScript interfaces and type definitions
├── config.ts                   # Configuration management
├── jdInsights.ts               # Job description parsing and keyword extraction
├── contacts.ts                 # Contact normalization, deduplication, scoring
├── paths.ts                    # Filesystem path utilities
├── emailPrompts.ts             # Email prompt building for Gemini
├── emailOrchestrator.ts        # Orchestrator for referral email generation
├── geminiStubs.ts              # Stubbed Gemini API calls (to be replaced)
└── generateApplicationForJob.ts # Main CLI script for generating applications
```

## Modules

### `types.ts`
Defines all TypeScript interfaces and type aliases used throughout the project:
- `JobRow`, `ContactRow`, `EmailRow`, `EventRow` - Google Sheets row schemas
- `ConfigMap` - Configuration structure
- `JDInsights` - Extracted job description insights
- `ResumeCustomizationResponse`, `CoverLetterResponse` - Gemini API response types
- Enum types for statuses, seniority levels, etc.

### `config.ts`
Centralized configuration management. Currently uses hard-coded values but can be extended to load from environment variables or Google Sheets. Includes:
- Rate limiting settings (emails per day, per company)
- Gemini model configuration
- File paths for resume/cover letter templates
- Title filters for contact discovery

### `jdInsights.ts`
Utilities for extracting structured insights from job descriptions:
- `getKeywords()` - Frequency-based keyword extraction
- `extractPhrases()` - Regex-based phrase extraction
- `extractJdInsights()` - Main function that returns keywords, requirements, and nice-to-haves

### `contacts.ts`
Contact processing pipeline:
- `normalizeContact()` - Converts raw contact data into standardized `ContactRow`
- `mergeAndDedupeContacts()` - Merges contacts from multiple sources, deduplicates by email
- `scoreContact()` - Scores a contact based on role, seniority, and job match
- `scoreContactsForJob()` - Scores and sorts all contacts for a job
- `selectContactsToEmail()` - Selects contacts while respecting daily/per-company limits

### `paths.ts`
Filesystem path helpers for organizing job outputs:
- `getJobFolder()` - Returns `outputs/{company_slug}/{job_id}`
- `getResumePath()` - Returns full path to `resume.tex`
- `getCoverLetterPath()` - Returns full path to `cover_letter.tex`

### `emailPrompts.ts`
Email prompt building for Gemini referral email generation:
- `buildReferralEmailPrompt()` - Builds system and user prompts from job/contact data
- Returns structured prompts ready for Gemini API calls

### `emailOrchestrator.ts`
Orchestrator for generating referral emails:
- `generateReferralEmailForContact()` - End-to-end function that takes job/contact and returns email content
- Handles prompt building, Gemini calls, and returns structured email result

### `geminiStubs.ts`
Stubbed implementations of Gemini API calls (to be replaced with real API integration):
- `callGeminiResumeCustomization()` - Returns fake resume customization suggestions
- `callGeminiCoverLetter()` - Returns fake cover letter text
- `callGeminiReferralEmail()` - Returns fake referral email (subject_a, subject_b, body)

### `generateApplicationForJob.ts`
Main CLI script that orchestrates the application generation process:
1. Loads job data (currently stubbed)
2. Extracts JD insights
3. Calls Gemini for resume customization
4. Calls Gemini for cover letter generation
5. Writes files to organized output folders

## Usage

### Prerequisites

- Node.js 18+
- TypeScript 5.3+
- `tsx` for running TypeScript directly (or compile with `tsc`)

### Installation

```bash
npm install
```

### Running the Application Generator

Generate customized resume and cover letter for a job:

```bash
npm start <jobId>
```

Example:
```bash
npm start ds-risk-xyz-001
```

This will:
1. Load the job data (currently stubbed)
2. Extract insights from the job description
3. Generate customized resume and cover letter
4. Save files to `outputs/{company_slug}/{job_id}/`

### Development

Run in watch mode for development:
```bash
npm run dev <jobId>
```

Compile TypeScript:
```bash
npm run build
```

## Integration with n8n

This codebase is designed to be integrated into n8n workflows:

- **Function nodes** can import and use the utility functions (`jdInsights`, `contacts`, `paths`, `emailPrompts`)
- **Execute Command nodes** can run `generateApplicationForJob.ts` as a CLI script
- **LLM nodes** will replace the stubbed Gemini calls in `geminiStubs.ts`

### Mapping to n8n Nodes

- `getJobRow()` → **Google Sheets node** or **Function node** with Sheets API
- `extractJdInsights()` → **Function node** (pure JS, no external deps)
- `mergeAndDedupeContacts()` → **Function node** (can be pasted directly)
- `scoreContactsForJob()` → **Function node**
- `buildReferralEmailPrompt()` → **Function node** (see `n8n-function-nodes.md`)
- `callGeminiResumeCustomization()` → **LLM (Gemini) node** with prompt formatting
- `callGeminiCoverLetter()` → **LLM (Gemini) node**
- `callGeminiReferralEmail()` → **LLM (Gemini) node**
- File writes → **Execute Command node** or **Write Binary File node**

### n8n Function Node Snippets

See `n8n-function-nodes.md` for copy-paste ready JavaScript code for:
- **PrepareReferralEmailInput** - Build prompts for Gemini
- **HandleGeminiReferralResponse** - Parse LLM JSON response
- **BuildGmailPayload** - Format email for Gmail node

## Next Steps

1. **Replace stubs with real API calls:**
   - Integrate Google Sheets API for job/contact data
   - Replace Gemini stubs with real API calls
   - Add Hunter.io and Jobrights.io integrations

2. **Add n8n workflow:**
   - Create n8n workflow JSON with Function nodes using this code
   - Set up Gmail integration for sending emails
   - Add reply monitoring and follow-up scheduling

3. **Enhance resume/cover letter generation:**
   - Integrate with Overleaf LaTeX templates
   - Add structured update application logic
   - Support Git commits for Overleaf sync

## License

MIT
