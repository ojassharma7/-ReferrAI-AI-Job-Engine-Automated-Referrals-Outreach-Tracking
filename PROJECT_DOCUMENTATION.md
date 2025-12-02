# ReferrAI - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Why Google Sheets vs Website?](#why-google-sheets-vs-website)
7. [Architecture Diagram](#architecture-diagram)
8. [API Integrations](#api-integrations)
9. [Deployment & Infrastructure](#deployment--infrastructure)

---

## 🎯 Project Overview

**ReferrAI** is an AI-powered, fully automated job referral and application engine that:

1. **Reads job postings** from Google Sheets
2. **Extracts insights** from job descriptions using NLP
3. **Generates customized resumes and cover letters** using Gemini AI
4. **Discovers relevant contacts** at target companies via Hunter.io
5. **Scores and prioritizes contacts** based on role relevance
6. **Drafts personalized referral emails** using AI
7. **Sends emails via Gmail API** with rate limiting
8. **Tracks responses** and updates status in Google Sheets
9. **Monitors email replies** and updates contact status

### Key Features
- ✅ **Fully Automated** - Runs daily via n8n workflows
- ✅ **AI-Powered** - Uses Gemini for content generation
- ✅ **Intelligent Contact Discovery** - Finds relevant recruiters and hiring managers
- ✅ **Rate Limited** - Prevents spam and respects email limits
- ✅ **Comprehensive Tracking** - All actions logged to Google Sheets
- ✅ **Modular Architecture** - Easy to test and extend

---

## 🏗️ Technical Architecture

### Architecture Pattern: **Hybrid Orchestration**

ReferrAI uses a **hybrid architecture** combining:
- **n8n** (Workflow Orchestration) - Handles scheduling, triggers, and data flow
- **Node.js/TypeScript** (Business Logic) - Handles complex processing, AI calls, and file operations

### Why This Architecture?

1. **n8n as Conductor**: 
   - Visual workflow management
   - Built-in integrations (Google Sheets, Gmail)
   - Easy scheduling and monitoring
   - No-code workflow modifications

2. **Node.js as Orchestra**:
   - Complex business logic
   - AI API integrations
   - File system operations
   - Testable, maintainable code

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  (Google Sheets - Job Input & Status Tracking)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   ORCHESTRATION LAYER                   │
│  (n8n Workflows - Scheduling & Data Flow)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                 │
│  (Node.js/TypeScript - Core Processing)                 │
│  - JD Analysis, AI Generation, Contact Discovery        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                     │
│  (External APIs - Gemini, Hunter.io, Gmail, Sheets)    │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **TypeScript** | 5.3+ | Type-safe development |
| **n8n** | Latest | Workflow orchestration |
| **Google Sheets API** | v4 | Job data storage & tracking |
| **Gmail API** | v1 | Email sending |
| **Gemini AI** | v1 (gemini-2.0-flash-001) | Content generation |
| **Hunter.io API** | v2 | Contact discovery |

### Key Libraries

```json
{
  "dependencies": {
    "googleapis": "^128.0.0",    // Google APIs (Sheets, Gmail)
    "dotenv": "^17.2.3"          // Environment variable management
  },
  "devDependencies": {
    "typescript": "^5.3.3",      // TypeScript compiler
    "tsx": "^4.7.0",             // TypeScript execution
    "@types/node": "^20.10.0"   // Node.js type definitions
  }
}
```

### Development Tools
- **tsx** - Run TypeScript directly without compilation
- **dotenv** - Environment variable management
- **ES Modules** - Modern JavaScript module system

---

## 🔧 System Components

### 1. **Job Pipeline** (`src/jobPipeline.ts`)
**Purpose**: Main orchestrator for processing a single job end-to-end

**Flow**:
1. Load job from Google Sheets (or stub)
2. Extract JD insights (keywords, requirements)
3. Generate customized resume via Gemini
4. Generate customized cover letter via Gemini
5. Discover contacts via Hunter.io
6. Score and filter contacts
7. Generate referral emails for each contact
8. Send emails (if enabled)
9. Persist all data to Google Sheets

**Key Functions**:
- `runJobPipeline(jobId: string)` - Main entry point

### 2. **Contact Discovery** (`src/contactsDiscovery.ts`)
**Purpose**: Find relevant contacts at target companies

**Sources**:
- **Hunter.io** - Domain search for email discovery
- **Jobrights.io** - Additional contact source (optional)

**Process**:
1. Extract company domain from job
2. Query Hunter.io domain-search API
3. Filter by relevant titles (recruiter, talent, hr, hiring manager, etc.)
4. Return normalized contact list

**Key Functions**:
- `discoverContactsForJob(job: JobRow)` - Main discovery function

### 3. **Contact Scoring** (`src/contacts.ts`)
**Purpose**: Score and prioritize contacts based on relevance

**Scoring Factors**:
- **Role Match** - How relevant is the contact's title?
- **Seniority** - VP/Director > Manager > IC
- **Team Function** - HR/Recruiting > Other departments
- **Verification Status** - Verified emails score higher

**Key Functions**:
- `scoreContact(contact, job)` - Score a single contact
- `scoreContactsForJob(contacts, job)` - Score all contacts
- `selectContactsToEmail(contacts, limits)` - Select top contacts

### 4. **AI Content Generation** (`src/geminiStubs.ts`)
**Purpose**: Generate personalized content using Gemini AI

**Generates**:
- **Resume Customization** - Tailored resume based on JD
- **Cover Letter** - Personalized cover letter
- **Referral Emails** - Two subject line variants + body

**Key Functions**:
- `callGeminiResumeCustomization(job, jdInsights, baseResume)`
- `callGeminiCoverLetter(job, jdInsights, candidateProfile, proofPoint)`
- `callGeminiReferralEmail(prompts)`

### 5. **Email Management** (`src/gmailClient.ts`)
**Purpose**: Send emails via Gmail API with attachments

**Features**:
- OAuth2 authentication
- Base64url encoding for messages
- Attachment support (resume, cover letter)
- Rate limiting integration
- Error handling and logging

**Key Functions**:
- `getGmailClient()` - Initialize Gmail client
- `sendEmailViaGmail(to, subject, body, attachments)`
- `sendReferralEmailDraft(draft, contactEmail)`

### 6. **Rate Limiting** (`src/rateLimiter.ts`)
**Purpose**: Control email sending frequency

**Limits**:
- **Per Minute**: Default 5 emails
- **Per Hour**: Default 50 emails
- **Per Day**: Default 500 emails
- **Per Domain**: Prevents spam to same company

**Key Functions**:
- `canSend(domain)` - Check if we can send
- `recordSent(domain)` - Record sent email
- `waitUntilCanSend(domain)` - Wait if needed

### 7. **Data Persistence** (`src/sheetsWriter.ts`)
**Purpose**: Write data to Google Sheets

**Sheets**:
- **contacts** - Discovered contacts
- **emails** - Email drafts and sent status
- **events** - All pipeline events (sent, reply, error, etc.)

**Key Functions**:
- `persistContactToSheets(contact, job)`
- `persistEmailToSheets(draft, result, sentResult)`
- `persistEventToSheets(event)`
- Batch operations for efficiency

### 8. **n8n Workflows** (`n8n/`)
**Purpose**: Orchestrate the entire system

**Workflows**:
1. **referral-engine-main.json** - Daily job processing
2. **referral-reply-monitor.json** - Email reply monitoring

---

## 🔄 Data Flow

### Complete Pipeline Flow

```
1. TRIGGER (n8n Cron - Daily 10:00 AM)
   ↓
2. READ JOBS (Google Sheets - "jobs" tab)
   ↓
3. FILTER JOBS (status = "ready" or "in_progress")
   ↓
4. FOR EACH JOB:
   ├─→ EXECUTE PIPELINE (Node.js)
   │   ├─→ Load Job Data
   │   ├─→ Extract JD Insights
   │   ├─→ Generate Resume (Gemini)
   │   ├─→ Generate Cover Letter (Gemini)
   │   ├─→ Discover Contacts (Hunter.io)
   │   ├─→ Score Contacts
   │   ├─→ Generate Emails (Gemini)
   │   ├─→ Send Emails (Gmail API) [if enabled]
   │   └─→ Persist to Sheets (contacts, emails, events)
   │
   └─→ UPDATE JOB STATUS (Google Sheets - "completed")
   ↓
5. MONITOR REPLIES (n8n Cron - Every 15 minutes)
   ├─→ Check Gmail for Replies
   ├─→ Match by thread_id
   └─→ Update Sheets (emails.status, contacts.status)
```

### Data Structures

**JobRow** (Input):
```typescript
{
  job_id: string
  company: string
  domain: string
  job_title: string
  jd_text: string
  status: 'ready' | 'in_progress' | 'completed'
  ...
}
```

**ContactRow** (Output):
```typescript
{
  contact_id: string
  job_id: string
  full_name: string
  email: string
  title: string
  seniority: 'IC' | 'Manager' | 'Director' | 'VP'
  score: number
  status: 'new' | 'emailed' | 'replied'
  ...
}
```

**EmailRow** (Output):
```typescript
{
  email_id: string
  contact_id: string
  subject_used: string
  body: string
  sent_at: string
  thread_id: string
  status: 'draft' | 'sent' | 'failed'
  ...
}
```

---

## 🤔 Why Google Sheets vs Website?

### Current Approach: Google Sheets

**Advantages**:
1. ✅ **No Frontend Development** - Zero UI code needed
2. ✅ **Easy Data Entry** - Non-technical users can add jobs
3. ✅ **Built-in Collaboration** - Multiple people can manage jobs
4. ✅ **Real-time Updates** - Changes reflect immediately
5. ✅ **Familiar Interface** - Everyone knows how to use Sheets
6. ✅ **No Database Setup** - Google handles infrastructure
7. ✅ **Free for Small Scale** - No hosting costs
8. ✅ **Integrated with n8n** - Native Google Sheets node
9. ✅ **Version History** - Built-in change tracking
10. ✅ **Export/Import** - Easy data migration

**Use Cases Where Sheets Works Best**:
- Small to medium scale (hundreds of jobs)
- Manual job entry
- Team collaboration
- Quick setup without infrastructure
- Non-technical users

### Alternative: Website Form

**Advantages**:
1. ✅ **Better UX** - Custom form validation, better UI
2. ✅ **API Integration** - Can integrate with job boards
3. ✅ **Scalability** - Better for thousands of jobs
4. ✅ **Custom Workflows** - More control over data flow
5. ✅ **User Authentication** - Multi-user support with roles
6. ✅ **Analytics** - Track usage patterns
7. ✅ **Mobile App** - Can build mobile interface

**Disadvantages**:
1. ❌ **Frontend Development** - Requires React/Vue/Angular
2. ❌ **Backend Development** - Requires API server
3. ❌ **Database Setup** - PostgreSQL/MongoDB needed
4. ❌ **Hosting Costs** - Server infrastructure
5. ❌ **Maintenance** - More moving parts
6. ❌ **Deployment Complexity** - CI/CD pipeline needed
7. ❌ **Longer Development Time** - Weeks vs days

### Hybrid Approach (Best of Both)

You could build a **website that writes to Google Sheets**:

```
Website Form → API Endpoint → Google Sheets API → n8n Pipeline
```

**Benefits**:
- ✅ Better UX than raw Sheets
- ✅ Still uses Sheets as database (no DB setup)
- ✅ Can add features like:
  - Job board integrations
  - Bulk import
  - Better validation
  - User authentication
  - Analytics dashboard

**Implementation**:
- Frontend: React/Next.js form
- Backend: Node.js API that writes to Sheets
- Still triggers n8n pipeline the same way

### Recommendation

**For MVP/Current Stage**: **Google Sheets** ✅
- Fastest to implement
- Zero infrastructure
- Works immediately
- Easy to test and iterate

**For Production/Scale**: **Website + Sheets Hybrid** 🚀
- Better UX
- More features
- Still leverages Sheets as database
- Can migrate to full database later if needed

---

## 📊 Architecture Diagram

See `ARCHITECTURE_DIAGRAM.md` for detailed visual diagrams.

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                              │
│  (Google Sheets - Jobs Tab)                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      n8n WORKFLOW ENGINE                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Daily Trigger (Cron - 10:00 AM)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Read Jobs from Google Sheets                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Execute Node.js Pipeline                                │   │
│  │  (npm run pipeline <job_id>)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS PIPELINE                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Load Job Data                                        │   │
│  │  2. Extract JD Insights                                  │   │
│  │  3. Generate Resume (Gemini AI)                          │   │
│  │  4. Generate Cover Letter (Gemini AI)                   │   │
│  │  5. Discover Contacts (Hunter.io)                         │   │
│  │  6. Score Contacts                                        │   │
│  │  7. Generate Emails (Gemini AI)                           │   │
│  │  8. Send Emails (Gmail API)                               │   │
│  │  9. Persist to Sheets                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIs                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Gemini   │  │ Hunter.io│  │  Gmail   │  │  Sheets  │      │
│  │   AI     │  │   API    │  │   API    │  │   API    │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ contacts │  │  emails  │  │  events  │                      │
│  │   tab    │  │   tab    │  │   tab    │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    REPLY MONITORING                             │
│  (n8n Cron - Every 15 minutes)                                  │
│  - Check Gmail for Replies                                      │
│  - Update Sheets Status                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Integrations

### 1. Google Sheets API
- **Purpose**: Job input, data persistence, status tracking
- **Authentication**: Service Account (JWT)
- **Operations**: Read jobs, write contacts/emails/events
- **Rate Limits**: 100 requests/100 seconds/user

### 2. Gemini AI API
- **Purpose**: Content generation (resume, cover letter, emails)
- **Authentication**: API Key
- **Model**: `gemini-2.0-flash-001`
- **Rate Limits**: Varies by tier
- **Endpoint**: `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent`

### 3. Hunter.io API
- **Purpose**: Contact discovery
- **Authentication**: API Key
- **Endpoint**: `https://api.hunter.io/v2/domain-search`
- **Rate Limits**: Free tier - 25 searches/month
- **Returns**: Email addresses, names, titles, verification status

### 4. Gmail API
- **Purpose**: Email sending
- **Authentication**: OAuth2 (Refresh Token)
- **Scope**: `https://www.googleapis.com/auth/gmail.send`
- **Operations**: Send email with attachments
- **Rate Limits**: 1 billion quota units/day (sending = 100 units)

---

## 🚀 Deployment & Infrastructure

### Current Setup
- **Local Development**: Node.js on local machine
- **n8n**: Self-hosted or n8n Cloud
- **Storage**: Google Sheets (cloud)
- **APIs**: All cloud-based

### Production Considerations

**Option 1: Self-Hosted**
- n8n on VPS (DigitalOcean, AWS EC2)
- Node.js pipeline on same server
- Environment variables via `.env` file
- Cost: ~$10-20/month

**Option 2: Serverless**
- n8n Cloud (hosted)
- Node.js pipeline on AWS Lambda / Vercel Functions
- Environment variables via platform config
- Cost: Pay-per-use

**Option 3: Hybrid**
- n8n Cloud (orchestration)
- Node.js on VPS (processing)
- Google Sheets (database)
- Cost: ~$15-30/month

### Environment Variables

All sensitive data stored in `.env`:
```env
# AI
GEMINI_API_KEY=...
USE_GEMINI=true
GEMINI_MODEL=gemini-2.0-flash-001

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY=...

# Contact Discovery
HUNTER_API_KEY=...

# Gmail
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_FROM_EMAIL=...

# Control
SEND_EMAILS=false
EMAIL_RATE_LIMIT_PER_MINUTE=5
EMAIL_RATE_LIMIT_PER_HOUR=50
EMAIL_RATE_LIMIT_PER_DAY=500
```

---

## 📈 Scalability

### Current Limits
- **Jobs**: Unlimited (Google Sheets limit: 10M cells)
- **Contacts**: ~1000 per job (Hunter.io free tier: 25 searches/month)
- **Emails**: 500/day (configurable)
- **Rate Limiting**: Per-minute, per-hour, per-day, per-domain

### Scaling Strategies

1. **Hunter.io Upgrade**: Paid tier for more searches
2. **Multiple Gmail Accounts**: Distribute load
3. **Job Batching**: Process jobs in batches
4. **Database Migration**: Move from Sheets to PostgreSQL for large scale
5. **Caching**: Cache JD insights, contact scores
6. **Queue System**: Use Redis/RabbitMQ for job queue

---

## 🔒 Security

### Authentication
- **Google Sheets**: Service Account (JWT)
- **Gmail**: OAuth2 (Refresh Token)
- **Gemini**: API Key
- **Hunter.io**: API Key

### Best Practices
- ✅ Environment variables (never commit `.env`)
- ✅ Service account with minimal permissions
- ✅ OAuth2 scopes limited to `gmail.send`
- ✅ Rate limiting to prevent abuse
- ✅ Error handling and logging

---

## 📝 Summary

ReferrAI is a **production-ready, fully automated job referral system** that:

- ✅ Uses **Google Sheets** for simplicity and collaboration
- ✅ Leverages **n8n** for orchestration
- ✅ Uses **Node.js/TypeScript** for business logic
- ✅ Integrates **Gemini AI** for content generation
- ✅ Discovers contacts via **Hunter.io**
- ✅ Sends emails via **Gmail API**
- ✅ Tracks everything in **Google Sheets**

**Why Sheets over Website?**
- Faster to build and iterate
- No infrastructure needed
- Easy for non-technical users
- Can always add website layer later

**Next Steps for Website**:
- Build React form that writes to Sheets
- Add job board integrations
- Create analytics dashboard
- Migrate to database if scale requires it

---

## 🎯 Conclusion

This architecture provides:
- **Rapid Development** - Built in days, not weeks
- **Easy Maintenance** - Modular, testable code
- **Scalability** - Can grow from hundreds to thousands of jobs
- **Flexibility** - Easy to add features or migrate components

The system is **production-ready** and has been **fully tested** with all APIs integrated! 🚀

