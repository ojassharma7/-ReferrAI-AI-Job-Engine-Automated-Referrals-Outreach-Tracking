# ReferrAI

**AI-powered job referral and automated application engine**

ReferrAI is a fully automated referral-request workflow built with n8n, Gemini AI, and Google Sheets. It discovers relevant contacts (via Hunter.io), drafts personalized emails with Gemini, generates customized resumes and cover letters tailored to each job description, and sends them through Gmail while tracking responses.

---

## 🏗️ Architecture

### High-Level System Architecture

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

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- TypeScript 5.3+
- n8n (for workflow orchestration)

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Gemini AI
GEMINI_API_KEY=your_key
USE_GEMINI=true
GEMINI_MODEL=gemini-2.0-flash-001

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your_id
GOOGLE_SHEETS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Hunter.io
HUNTER_API_KEY=your_key

# Gmail
GMAIL_CLIENT_ID=your_id
GMAIL_CLIENT_SECRET=your_secret
GMAIL_REFRESH_TOKEN=your_token
GMAIL_FROM_EMAIL=your-email@gmail.com
SEND_EMAILS=false  # Set to true when ready

# Rate Limiting
EMAIL_RATE_LIMIT_PER_MINUTE=5
EMAIL_RATE_LIMIT_PER_HOUR=50
EMAIL_RATE_LIMIT_PER_DAY=500
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed API setup instructions.

### Usage

**Run Full Pipeline:**
```bash
npm run pipeline <job_id>
```

**Test Components:**
```bash
npm run test:sheets      # Test Google Sheets integration
npm run test:email       # Test single email send
npm run test:pipeline    # Test full pipeline (dry run)
```

---

## 📋 Features

- ✅ **AI-Powered Content Generation** - Gemini AI generates customized resumes, cover letters, and referral emails
- ✅ **Intelligent Contact Discovery** - Hunter.io finds relevant recruiters and hiring managers
- ✅ **Smart Contact Scoring** - Prioritizes contacts based on role, seniority, and relevance
- ✅ **Automated Email Sending** - Gmail API integration with rate limiting and attachments
- ✅ **Comprehensive Tracking** - All actions logged to Google Sheets (contacts, emails, events)
- ✅ **Reply Monitoring** - n8n workflow monitors email replies and updates status
- ✅ **Rate Limiting** - Configurable limits per minute, hour, day, and per domain
- ✅ **Graceful Fallbacks** - Works with stubbed data if APIs aren't configured

---

## 🏗️ Project Structure

```
src/
├── jobPipeline.ts              # Main orchestrator
├── types.ts                    # TypeScript interfaces
├── config.ts                   # Configuration
├── env.ts                      # Environment variables
├── logger.ts                   # Logging
├── sheetsClient.ts             # Google Sheets API (read)
├── sheetsWriter.ts             # Google Sheets API (write)
├── geminiClient.ts             # Gemini API client
├── geminiStubs.ts              # AI content generation
├── contactsDiscovery.ts        # Hunter.io integration
├── contacts.ts                 # Contact scoring & filtering
├── jdInsights.ts               # Job description analysis
├── emailOrchestrator.ts        # Email generation
├── emailDrafts.ts              # Draft management
├── gmailClient.ts              # Gmail API integration
├── rateLimiter.ts              # Rate limiting
└── paths.ts                    # File path utilities
```

---

## 🔧 Core Components

### 1. Job Pipeline (`jobPipeline.ts`)
Main orchestrator that processes a job end-to-end:
- Loads job from Google Sheets
- Extracts JD insights (keywords, requirements)
- Generates resume & cover letter via Gemini
- Discovers contacts via Hunter.io
- Scores and filters contacts
- Generates referral emails
- Sends emails (if enabled)
- Persists all data to Sheets

### 2. Contact Discovery (`contactsDiscovery.ts`)
- Queries Hunter.io domain-search API
- Filters by relevant titles (recruiter, talent, hr, etc.)
- Returns normalized contact list

### 3. Contact Scoring (`contacts.ts`)
Scores contacts based on:
- Role match (40%)
- Seniority (30%)
- Team function (20%)
- Verification status (10%)

### 4. AI Content Generation (`geminiStubs.ts`)
Uses Gemini AI to generate:
- Customized resumes
- Personalized cover letters
- Referral emails (2 subject variants + body)

### 5. Email Management (`gmailClient.ts`)
- OAuth2 authentication
- Attachment support (resume, cover letter)
- Rate limiting integration
- Error handling

### 6. Data Persistence (`sheetsWriter.ts`)
Writes to Google Sheets:
- **contacts** tab - Discovered contacts
- **emails** tab - Email drafts and status
- **events** tab - All pipeline events

---

## 📊 Data Flow

1. **Input**: Jobs added to Google Sheets (`jobs` tab)
2. **Trigger**: n8n workflow runs daily at 10:00 AM
3. **Processing**: Node.js pipeline executes for each job:
   - Extracts JD insights
   - Generates resume & cover letter
   - Discovers contacts
   - Scores contacts
   - Generates emails
   - Sends emails (if enabled)
4. **Output**: Data persisted to Sheets (contacts, emails, events)
5. **Monitoring**: Reply monitor checks Gmail every 15 minutes

---

## 🔌 API Integrations

### Google Sheets API
- **Purpose**: Job input, data persistence
- **Auth**: Service Account (JWT)
- **Operations**: Read jobs, write contacts/emails/events

### Gemini AI API
- **Purpose**: Content generation
- **Auth**: API Key
- **Model**: `gemini-2.0-flash-001`
- **Generates**: Resumes, cover letters, emails

### Hunter.io API
- **Purpose**: Contact discovery
- **Auth**: API Key
- **Endpoint**: `domain-search`
- **Returns**: Email addresses, names, titles

### Gmail API
- **Purpose**: Email sending
- **Auth**: OAuth2 (Refresh Token)
- **Scope**: `gmail.send`
- **Features**: Attachments, rate limiting

---

## 🔄 n8n Workflows

### Main Daily Referral Engine
- **Trigger**: Daily at 10:00 AM
- **Flow**: Reads jobs → Executes pipeline → Updates status
- **File**: `n8n/referral-engine-main.json`

### Gmail Reply Monitor
- **Trigger**: Every 15 minutes
- **Flow**: Checks Gmail → Matches replies → Updates Sheets
- **File**: `n8n/referral-reply-monitor.json`

**Import**: Load JSON files in n8n UI → Configure credentials → Set environment variables

---

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Step-by-step API setup
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing instructions
- **[COMPREHENSIVE_TESTING_GUIDE.md](./COMPREHENSIVE_TESTING_GUIDE.md)** - Full testing suite
- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete technical documentation
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Detailed architecture diagrams

---

## 🧪 Testing

### Test Single Email
```bash
npm run test:email
```

### Test Full Pipeline (Dry Run)
```bash
npm run test:pipeline test-job-001
```

### Test Google Sheets
```bash
npm run test:sheets
```

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing instructions.

---

## ⚙️ Configuration

### Rate Limiting
```env
EMAIL_RATE_LIMIT_PER_MINUTE=5
EMAIL_RATE_LIMIT_PER_HOUR=50
EMAIL_RATE_LIMIT_PER_DAY=500
EMAIL_DELAY_MS=2000
```

### Email Sending
```env
SEND_EMAILS=false  # Set to true to enable
```

### Gemini Model
```env
USE_GEMINI=true
GEMINI_MODEL=gemini-2.0-flash-001
```

---

## 🗂️ Google Sheets Structure

### Jobs Tab (Required Columns)
- `job_id`, `company`, `company_slug`, `domain`
- `job_title`, `job_family`, `job_location`, `job_url`
- `jd_text`, `status` (ready/in_progress/completed)

### Contacts Tab (Auto-generated)
- `contact_id`, `job_id`, `full_name`, `email`, `title`
- `seniority`, `score`, `status`, `source`

### Emails Tab (Auto-generated)
- `email_id`, `contact_id`, `job_id`, `subject_used`, `body`
- `sent_at`, `thread_id`, `status`

### Events Tab (Auto-generated)
- `event_id`, `contact_id`, `job_id`, `type`, `timestamp`

---

## 🚀 Deployment

### Option 1: Self-Hosted
- n8n on VPS (DigitalOcean, AWS EC2)
- Node.js pipeline on same server
- Cost: ~$10-20/month

### Option 2: Serverless
- n8n Cloud (hosted)
- Node.js on AWS Lambda / Vercel Functions
- Cost: Pay-per-use

### Option 3: Hybrid
- n8n Cloud (orchestration)
- Node.js on VPS (processing)
- Cost: ~$15-30/month

---

## 🔒 Security

- Environment variables for all sensitive data
- Service account with minimal permissions
- OAuth2 scopes limited to `gmail.send`
- Rate limiting to prevent abuse
- Error handling and logging

---

## 📈 Scalability

**Current Limits:**
- Jobs: Unlimited (Sheets limit: 10M cells)
- Contacts: ~1000 per job (Hunter.io free: 25 searches/month)
- Emails: 500/day (configurable)

**Scaling Strategies:**
- Upgrade Hunter.io tier
- Multiple Gmail accounts
- Job batching
- Database migration (PostgreSQL)
- Queue system (Redis/RabbitMQ)

---

## 🤔 Why Google Sheets?

**Advantages:**
- ✅ No frontend development needed
- ✅ Easy for non-technical users
- ✅ Built-in collaboration
- ✅ Zero infrastructure costs
- ✅ Fast to implement
- ✅ Can add website layer later

**Future Enhancement:** Build website form that writes to Sheets for better UX while keeping Sheets as database.

---

## 📝 License

MIT

---

## 🎯 Status

✅ **Production Ready** - All APIs integrated and tested
✅ **Fully Automated** - Runs daily via n8n workflows
✅ **Comprehensive Testing** - Test suite included
✅ **Well Documented** - Complete documentation provided

---

For detailed technical documentation, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).
