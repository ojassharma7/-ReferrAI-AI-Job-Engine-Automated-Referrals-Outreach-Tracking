# ReferrAI

**AI-powered job referral and automated application engine**

ReferrAI is a fully automated referral-request workflow built with n8n, Gemini AI, and Google Sheets. It discovers relevant contacts (via Hunter.io and Jobrights.io), drafts personalized emails with Gemini, generates customized resumes and cover letters tailored to each job description, and sends them through Gmail while tracking responses.

## 📊 System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Input Layer"
        A[Google Sheets<br/>Jobs Tab]
    end
    
    subgraph "Orchestration Layer"
        B[n8n Workflow Engine]
        B1[Daily Trigger<br/>10:00 AM]
        B2[Read Jobs]
        B3[Execute Pipeline]
    end
    
    subgraph "Processing Layer"
        C[Node.js Pipeline]
        C1[Load Job]
        C2[Extract JD Insights]
        C3[Generate Resume]
        C4[Generate Cover Letter]
        C5[Discover Contacts]
        C6[Score Contacts]
        C7[Generate Emails]
        C8[Send Emails]
        C9[Persist Data]
    end
    
    subgraph "External APIs"
        D1[Gemini AI<br/>Content Generation]
        D2[Hunter.io<br/>Contact Discovery]
        D3[Gmail API<br/>Email Sending]
        D4[Google Sheets API<br/>Data Persistence]
    end
    
    subgraph "Output Layer"
        E1[Google Sheets<br/>Contacts Tab]
        E2[Google Sheets<br/>Emails Tab]
        E3[Google Sheets<br/>Events Tab]
        E4[File System<br/>Resume & Cover Letter]
    end
    
    subgraph "Monitoring"
        F[n8n Reply Monitor<br/>Every 15 min]
        F1[Check Gmail Replies]
        F2[Update Sheets Status]
    end
    
    A --> B
    B --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C
    C --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C5 --> C6
    C6 --> C7
    C7 --> C8
    C8 --> C9
    
    C3 --> D1
    C4 --> D1
    C7 --> D1
    C5 --> D2
    C8 --> D3
    C9 --> D4
    
    D4 --> E1
    D4 --> E2
    D4 --> E3
    C3 --> E4
    C4 --> E4
    
    D3 --> F
    F --> F1
    F1 --> F2
    F2 --> E2
```

### Complete Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Sheets as Google Sheets
    participant n8n as n8n Workflow
    participant Pipeline as Node.js Pipeline
    participant Gemini as Gemini AI
    participant Hunter as Hunter.io
    participant Gmail as Gmail API
    
    User->>Sheets: Add Job (job_id, company, jd_text, etc.)
    Note over Sheets: Status = "ready"
    
    n8n->>n8n: Daily Trigger (10:00 AM)
    n8n->>Sheets: Read Jobs (status = "ready")
    Sheets-->>n8n: Return Job List
    
    loop For Each Job
        n8n->>Pipeline: Execute pipeline <job_id>
        
        Pipeline->>Sheets: Load Job Data
        Sheets-->>Pipeline: JobRow
        
        Pipeline->>Pipeline: Extract JD Insights
        Note over Pipeline: Keywords, Requirements, Nice-to-haves
        
        Pipeline->>Gemini: Generate Resume
        Gemini-->>Pipeline: Customized Resume
        
        Pipeline->>Gemini: Generate Cover Letter
        Gemini-->>Pipeline: Cover Letter
        
        Pipeline->>Hunter: Discover Contacts (domain)
        Hunter-->>Pipeline: Contact List
        
        Pipeline->>Pipeline: Score & Filter Contacts
        
        loop For Each Contact
            Pipeline->>Gemini: Generate Referral Email
            Gemini-->>Pipeline: Email (subject_a, subject_b, body)
            
            Pipeline->>Gmail: Send Email (with attachments)
            Gmail-->>Pipeline: Thread ID, Message ID
            
            Pipeline->>Sheets: Persist Email
            Pipeline->>Sheets: Persist Contact
            Pipeline->>Sheets: Log Event
        end
        
        Pipeline-->>n8n: Pipeline Complete
        n8n->>Sheets: Update Job Status = "completed"
    end
    
    Note over n8n,Gmail: Reply Monitor (Every 15 min)
    n8n->>Gmail: Check for Replies
    Gmail-->>n8n: Reply Messages
    n8n->>Sheets: Update Email Status
    n8n->>Sheets: Update Contact Status
```

**📖 For more detailed architecture diagrams, see [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) or [docs/ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md)**

## 🚀 Quick Start

### For the Website (Recommended)
```bash
cd website
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

**See [docs/website/QUICK_START.md](docs/website/QUICK_START.md) for detailed setup.**

### For the Main Pipeline
```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm run pipeline <jobId>
```

## 📁 Project Structure

This repository contains two main components:

1. **Main Pipeline** (`src/`) - Node.js CLI application for automated job processing
2. **Website** (`website/`) - Next.js web application for interactive contact discovery and job search

**See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete organization guide.**

## Project Structure

```
src/
├── types.ts                    # TypeScript interfaces and type definitions
├── config.ts                   # Configuration management
├── env.ts                      # Environment variable loading and validation
├── logger.ts                   # Unified logging with timestamps and colors
├── geminiClient.ts             # Real Gemini API client (REST API)
├── sheetsClient.ts             # Google Sheets API client (service account)
├── contactsDiscovery.ts        # Hunter.io + Jobrights.io contact discovery
├── jdInsights.ts               # Job description parsing and keyword extraction
├── contacts.ts                 # Contact normalization, deduplication, scoring
├── paths.ts                    # Filesystem path utilities
├── emailPrompts.ts             # Email prompt building for Gemini
├── emailOrchestrator.ts        # Orchestrator for referral email generation
├── emailDrafts.ts              # Email draft creation and management
├── sheetsPayload.ts            # Prepare data payloads for Google Sheets
├── jobPipeline.ts              # Full pipeline orchestrator
├── geminiStubs.ts              # Gemini API calls with real/stub fallback
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

### `env.ts`
Environment variable loading and validation:
- `loadEnv()` - Validates required environment variables
- Checks for `GEMINI_API_KEY` when `USE_GEMINI=true`
- Sets defaults for `USE_GEMINI` and `GEMINI_MODEL`
- Throws clear errors if required variables are missing

### `logger.ts`
Unified logging module with timestamps and color coding:
- `logInfo()` - Green info messages
- `logWarn()` - Yellow warning messages
- `logError()` - Red error messages
- All logs include timestamps in ISO format
- Safe to use in n8n Execute Command nodes

### `geminiClient.ts`
Real Gemini API client using REST API:
- `callGemini()` - Calls Gemini REST endpoint directly (no SDK)
- Reads API key from `process.env.GEMINI_API_KEY`
- Returns raw text output (caller handles JSON parsing)
- Handles errors gracefully

### `sheetsClient.ts`
Google Sheets API client using service account authentication:
- `getJobRowFromSheets()` - Reads a single job by job_id from the jobs sheet
- `listJobsFromSheets()` - Lists all jobs, optionally filtered by status
- Uses `googleapis` package with JWT authentication
- Handles escaped newlines in private keys
- Falls back gracefully if Sheets is not configured

### `contactsDiscovery.ts`
Contact discovery via Hunter.io and Jobrights.io:
- `discoverContactsForJob()` - Discovers contacts for a job using both APIs
- Filters by relevant titles (recruiter, talent, hr, etc.)
- Returns `DiscoveredContactRaw[]` with source attribution
- Falls back to stubbed contacts if APIs are not configured

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

### `emailDrafts.ts`
Email draft creation and management:
- `createReferralEmailDraft()` - Creates a structured email draft from Gemini result
- Randomly selects subject_a or subject_b
- Generates unique email IDs and timestamps
- Includes attachment paths

### `sheetsPayload.ts`
Prepare data payloads for Google Sheets:
- `buildContactsSheetRow()` - Flattens ContactRow for Sheets
- `buildEmailsSheetRow()` - Flattens ReferralEmailDraft for Sheets
- `buildEventsSheetRow()` - Flattens EventRow for Sheets
- `createEventRow()` - Helper to create event rows
- Converts arrays to comma-separated strings, ensures no nested objects

### `jobPipeline.ts`
Full pipeline orchestrator for processing a single job end-to-end:
- `runJobPipeline()` - Complete workflow from job loading to email generation
- Handles resume/cover letter generation, contact discovery, scoring, email drafting
- Logs events and prints comprehensive summary

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

### Running the Full Pipeline

Run the complete end-to-end pipeline for a job (resume, cover letter, contact discovery, email generation):

```bash
npm run pipeline <jobId>
```

Example:
```bash
npm run pipeline ds-risk-xyz-001
```

This orchestrates the entire workflow:
1. Loads job data
2. Extracts JD insights
3. Generates customized resume and cover letter
4. Discovers and scores contacts
5. Generates referral emails for each contact
6. Creates email drafts
7. Logs events
8. Prints a comprehensive summary

### Development

Run in watch mode for development:
```bash
npm run dev <jobId>
```

Compile TypeScript:
```bash
npm run build
```

## Gmail Integration

The system can send emails via Gmail API with rate limiting, attachment support, and automatic tracking in Google Sheets.

### Environment Variables

Required environment variables for Gmail sending:

```env
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_FROM_EMAIL=your-email@gmail.com  # Optional, defaults to authenticated account
SEND_EMAILS=true  # Set to 'true' or '1' to enable email sending
EMAIL_RATE_LIMIT_PER_MINUTE=5  # Optional, defaults to 5
EMAIL_RATE_LIMIT_PER_HOUR=50  # Optional, defaults to 50
EMAIL_DELAY_MS=2000  # Optional, delay between emails in milliseconds, defaults to 2000
```

### Gmail OAuth2 Setup

1. **Create a Google Cloud Project** (or use existing)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Gmail API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in app name, user support email, developer contact
     - Add scopes: `https://www.googleapis.com/auth/gmail.send`
     - Add test users (your email)
     - Save and continue
   - Back to Credentials, create OAuth client ID:
     - Application type: "Desktop app" or "Web application"
     - Name: "ReferrAI Gmail Client"
     - Click "Create"
   - Download the JSON file or copy Client ID and Client Secret

4. **Get Refresh Token**
   - Use the OAuth 2.0 Playground or a script to get a refresh token:
   - Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Click the gear icon (⚙️) in top right
   - Check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - In the left panel, find "Gmail API v1"
   - Select `https://www.googleapis.com/auth/gmail.send`
   - Click "Authorize APIs"
   - Sign in with your Gmail account
   - Click "Exchange authorization code for tokens"
   - Copy the "Refresh token" value

5. **Set Environment Variables**
   ```bash
   export GMAIL_CLIENT_ID=your_client_id
   export GMAIL_CLIENT_SECRET=your_client_secret
   export GMAIL_REFRESH_TOKEN=your_refresh_token
   export SEND_EMAILS=true
   ```

### Features

- **Rate Limiting**: Configurable limits per minute, hour, and day
- **Per-Domain Rate Limiting**: Limits emails per company domain to avoid spam
- **Attachment Support**: Automatically attaches resume and cover letter PDFs
- **Sheets Integration**: Automatically updates `emails` sheet with:
  - `sent_at` timestamp
  - `thread_id` from Gmail
  - `status` (sent/failed/draft)
  - `last_error` if sending fails
- **Graceful Fallback**: If Gmail is not configured, emails are created as drafts only

### Email Sending Flow

1. Pipeline generates email drafts for each contact
2. If `SEND_EMAILS=true`, emails are sent via Gmail API:
   - Rate limiter checks if we can send (respects per-minute/hour/day limits)
   - Waits if needed to respect rate limits
   - Sends email with attachments (resume.tex, cover_letter.tex)
   - Records thread_id and message_id
3. Email status is persisted to Sheets `emails` sheet
4. Events are logged to Sheets `events` sheet

### Testing

Test email sending (dry-run mode, no actual sending):
```bash
# Without SEND_EMAILS, emails are created as drafts only
npm run pipeline <jobId>
```

Test with actual email sending:
```bash
SEND_EMAILS=true npm run pipeline <jobId>
```

### Rate Limiting

The rate limiter prevents:
- Sending too many emails too quickly (default: 5 per minute)
- Exceeding hourly limits (default: 50 per hour)
- Exceeding daily limits (default: 500 per day)
- Sending multiple emails to the same company too quickly (per-domain limiting)

You can customize these limits via environment variables:
```env
EMAIL_RATE_LIMIT_PER_MINUTE=10
EMAIL_RATE_LIMIT_PER_HOUR=100
EMAIL_DELAY_MS=3000  # 3 seconds between emails
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

## Full Pipeline Example

The `runJobPipeline()` function provides an end-to-end dry-run of the entire system. It demonstrates how all components work together:

### How It Works

1. **Job Loading** - Loads job data (currently stubbed, will use Google Sheets API)
2. **JD Analysis** - Extracts keywords, requirements, and nice-to-haves
3. **Resume & Cover Letter** - Generates customized documents using Gemini
4. **Contact Discovery** - Finds relevant contacts (stubbed, will use Hunter.io + Jobrights.io)
5. **Contact Scoring** - Scores and prioritizes contacts based on role and seniority
6. **Email Generation** - Creates personalized referral emails for each contact
7. **Draft Creation** - Builds structured email drafts with attachments
8. **Event Logging** - Records all actions for observability

### Example Usage

```bash
npm run pipeline ds-risk-xyz-001
```

### Output

The pipeline prints:
- Job details and JD insights
- File paths for generated resume and cover letter
- Number of contacts discovered and scored
- Sample email subject and body
- Summary of all events logged

### Mapping to n8n

This pipeline maps 1:1 to future n8n workflows:
- Each step becomes a node or node group
- Function nodes use the same logic from this codebase
- Google Sheets nodes replace stubbed data loading
- LLM nodes replace Gemini stubs
- Gmail nodes handle actual email sending
- Event logging writes to Sheets `events` table

The modular structure allows you to:
- Test each component independently
- Copy-paste Function node code directly
- Replace stubs incrementally with real APIs
- Maintain the same data flow in n8n

## Using Real Gemini API

The codebase supports both stubbed responses (for testing) and real Gemini API calls. To use the real API:

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
USE_GEMINI=true
GEMINI_MODEL=gemini-pro
```

Or set them in your environment:

```bash
export GEMINI_API_KEY=your_api_key_here
export USE_GEMINI=true
export GEMINI_MODEL=gemini-pro
```

### Running with Real LLM

```bash
USE_GEMINI=true npm run pipeline ds-risk-xyz-001
```

Or with a `.env` file:

```bash
npm run pipeline ds-risk-xyz-001
```

### How It Works

- When `USE_GEMINI=true`, the code calls the real Gemini REST API
- If the API call fails or parsing fails, it automatically falls back to stubs
- All API calls are logged with timestamps and status
- The `GEMINI_MODEL` environment variable defaults to `gemini-pro` if not set

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file or environment variables

## Google Sheets & Contact Discovery

The system integrates with Google Sheets for job data and Hunter.io/Jobrights.io for contact discovery. Both are optional - if not configured, the system falls back to stubbed data.

### Google Sheets Integration

The `sheetsClient.ts` module reads jobs from a Google Sheets spreadsheet using service account authentication. When configured, `getJobRow()` and `runJobPipeline()` will use real job data from Sheets instead of stubbed data.

#### Environment Variables

Required environment variables:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note:** The `GOOGLE_SHEETS_PRIVATE_KEY` should include the full private key with `\n` characters (the code handles converting `\\n` to actual newlines).

#### Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable the Google Sheets API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create a Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Give it a name (e.g., "referrai-sheets-reader")
   - Click "Create and Continue"
   - Skip role assignment (optional)
   - Click "Done"

4. **Create and Download Key**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file

5. **Extract Credentials from JSON**
   - Open the downloaded JSON file
   - Copy the `client_email` value → `GOOGLE_SHEETS_CLIENT_EMAIL`
   - Copy the `private_key` value → `GOOGLE_SHEETS_PRIVATE_KEY` (keep the `\n` characters)

6. **Share Your Google Sheet**
   - Open your Google Sheet
   - Click "Share" button
   - Add the service account email (from step 4) as a viewer
   - Click "Send"

7. **Get Spreadsheet ID**
   - Open your Google Sheet
   - The URL will look like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` → `GOOGLE_SHEETS_SPREADSHEET_ID`

8. **Set Environment Variables**
   ```bash
   export GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   export GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   export GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

#### Sheet Structure

Your Google Sheet must have a sheet named `jobs` with the following columns in the header row:

**Required columns:**
- `job_id` - Unique identifier for the job
- `company` - Company name
- `company_slug` - URL-friendly company identifier (e.g., "xyz-bank")
- `domain` - Company email domain (e.g., "xyz.com")
- `job_title` - Job title
- `job_family` - Job category (e.g., "Data Science", "Engineering")
- `job_location` - Location (e.g., "New York, NY")
- `job_url` - URL to the job posting
- `jd_text` - Full job description text

**Optional columns:**
- `jd_keywords` - Comma-separated keywords
- `status` - Job status (defaults to 'ready' if not provided)
- `resume_status` - Resume generation status
- `cover_letter_status` - Cover letter generation status
- `notes` - Additional notes
- `last_synced_at` - Last sync timestamp

#### Behavior

- **`getJobRowFromSheets(jobId)`** - Reads from the `jobs` sheet, finds the row where `job_id` matches, returns `JobRow` or `null`
- **`listJobsFromSheets(statuses?)`** - Lists all jobs, optionally filtered by status array (e.g., `['ready', 'in_progress']`)
- **Fallback**: If Sheets is not configured or API fails, the system automatically falls back to stubbed job data
- **`getJobRow()` in pipeline scripts** - Now uses Sheets when configured, falls back to stubs when not

#### Testing

Test your Google Sheets integration:

```bash
npm run test:sheets
```

This will:
- List all jobs with status 'ready' or 'in_progress'
- Show how many jobs were found
- Display the first job for inspection
- Exit gracefully if Sheets is not configured (no crash)

### Contact Discovery Integration

The `contactsDiscovery.ts` module discovers contacts using Hunter.io and Jobrights.io APIs.

#### Environment Variables

```env
HUNTER_API_KEY=your_hunter_api_key
JOBRIGHTS_API_KEY=your_jobrights_api_key
JOBRIGHTS_BASE_URL=https://api.jobrights.io  # Optional, defaults to this
```

#### Hunter.io Setup

1. Sign up at [Hunter.io](https://hunter.io)
2. Get your API key from the dashboard
3. Set `HUNTER_API_KEY` environment variable:
   ```bash
   export HUNTER_API_KEY=your_api_key_here
   ```

The module uses the [domain-search endpoint](https://api.hunter.io/v2/domain-search) to find all emails at a company domain, then filters for relevant titles (recruiter, talent, hr, hiring manager, director, etc.).

**API Endpoints Used:**
- `domain-search` - Finds all emails at a domain (used for contact discovery)
- The `email-finder` and `email-verifier` endpoints are available but not currently used in the pipeline

#### Jobrights.io Setup

1. Sign up at [Jobrights.io](https://jobrights.io) (or your provider)
2. Get your API key/token
3. Set `JOBRIGHTS_API_KEY` and optionally `JOBRIGHTS_BASE_URL`

**Note:** The Jobrights API structure may vary. You may need to adjust the endpoint and response parsing in `contactsDiscovery.ts` based on their actual API documentation.

#### Behavior

- `discoverContactsForJob(job)` - Calls both Hunter.io and Jobrights.io
- Filters contacts by relevant titles (recruiter, talent, hr, etc.)
- Returns `DiscoveredContactRaw[]` with source attribution
- If APIs are not configured, returns stubbed contacts (Priya + Maya) for testing
- If APIs are configured but return no results, returns empty array and logs a warning

### Fallback Behavior

When environment variables are missing:
- **Google Sheets**: Falls back to stubbed job data (XYZ Bank example)
- **Contact Discovery**: Falls back to stubbed contacts (Priya + Maya)
- **Pipeline still runs**: `npm run pipeline ds-risk-xyz-001` works without any API keys

This allows you to:
- Test the pipeline immediately without configuring APIs
- Gradually add integrations as needed
- Keep the system working even if APIs are temporarily unavailable

## n8n Workflows

The project includes two n8n workflows that orchestrate the referral engine:

### Main Daily Referral Engine (`n8n/referral-engine-main.json`)

**Purpose:** Runs daily, reads jobs from Google Sheets, and calls the Node.js pipeline to generate resumes, cover letters, contact discovery, and referral email drafts.

**Flow:**
1. **Daily Trigger** - Cron node runs once per day at 10:00 AM
2. **Read Jobs from Sheets** - Loads all jobs from the `jobs` sheet
3. **Filter Jobs** - Only processes jobs with status `ready` or `in_progress`
4. **For Each Job:**
   - Build JobRow structure
   - Extract JD insights
   - Generate file paths
   - Execute `npm run pipeline <job_id>` (runs the full Node.js pipeline)
   - Update job status to `completed` in Sheets

**Key Features:**
- Uses Split In Batches to process jobs one at a time
- Calls the existing Node.js pipeline (which handles all the heavy lifting)
- Updates job status after successful processing
- Falls back gracefully if Sheets is not configured

### Gmail Reply Monitor (`n8n/referral-reply-monitor.json`)

**Purpose:** Runs every 15 minutes, checks Gmail for replies, and updates the emails, contacts, and events sheets accordingly.

**Flow:**
1. **Trigger** - Cron node runs every 15 minutes
2. **Fetch Gmail Messages** - Gets messages from the last 24 hours
3. **Map Replies** - Extracts thread_id, from, subject, snippet
4. **Lookup in Sheets** - Finds matching email by thread_id in the `emails` sheet
5. **If Matched:**
   - Check if reply is positive (keyword-based)
   - Update `emails.status` → `"reply"`
   - Update `contacts.status` → `"replied"`, `followup_stage` → `99`
   - Append event to `events` sheet with type `"reply"` or `"positive"`

**Key Features:**
- Automatically detects replies to sent emails
- Marks contacts as replied (stops follow-ups)
- Logs all reply events for tracking
- Simple positivity detection based on keywords

### Importing Workflows

1. **In n8n UI:**
   - Go to **Workflows** → **Import** → **From file**
   - Select `n8n/referral-engine-main.json` or `n8n/referral-reply-monitor.json`
   - Click **Import**

2. **Configure Credentials:**
   - **Google Sheets (ReferrAI)** - Set up OAuth2 or Service Account credentials
   - **Gmail (ReferrAI)** - Set up Gmail OAuth2 credentials
   - Configure in n8n → **Credentials** → **Add Credential**

3. **Set Environment Variables:**
   - `GOOGLE_SHEETS_SPREADSHEET_ID` - Your spreadsheet ID
   - `HUNTER_API_KEY` - Your Hunter.io API key (if using)
   - `GEMINI_API_KEY` - Your Gemini API key (if using real LLM)
   - `USE_GEMINI` - Set to `true` to use real Gemini API

4. **Adjust Paths:**
   - Update the Execute Command node path in `referral-engine-main.json` to match your project location
   - The current path is: `/Users/ojassharma/Desktop/PERSONAL_ PROJECTS_GITHUB/-ReferrAI-AI-Job-Engine-Automated-Referrals-Outreach-Tracking`

### Workflow Architecture

**n8n as Conductor, Node.js as Orchestra:**
- n8n handles orchestration (triggers, data flow, Sheets updates)
- Node.js pipeline (`npm run pipeline`) handles the heavy lifting:
  - JD analysis
  - Resume/cover letter generation
  - Contact discovery
  - Email drafting
  - File writing

This separation allows you to:
- Test the Node.js pipeline independently
- Debug issues in isolation
- Update logic without touching n8n workflows
- Run pipelines manually when needed

## Next Steps

1. **Configure n8n:**
   - Import the workflow JSON files
   - Set up credentials (Sheets, Gmail)
   - Adjust paths and environment variables
   - Test workflows manually before enabling cron triggers

2. **Enhance workflows:**
   - Add error handling and retry logic
   - Add email sending via Gmail node
   - Add follow-up scheduling
   - Add rate limiting per company/domain

3. **Enhance resume/cover letter generation:**
   - Integrate with Overleaf LaTeX templates
   - Add structured update application logic
   - Support Git commits for Overleaf sync

## License

MIT
