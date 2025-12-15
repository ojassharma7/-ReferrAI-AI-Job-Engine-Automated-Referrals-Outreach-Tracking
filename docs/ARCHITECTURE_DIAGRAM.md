# ReferrAI - Architecture Diagrams

## 📊 System Architecture Overview

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

---

## 🔄 Complete Data Flow

### End-to-End Pipeline Flow

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

## 🏗️ Component Architecture

### Module Dependencies

```mermaid
graph TD
    subgraph "Core Modules"
        A[jobPipeline.ts<br/>Main Orchestrator]
        B[types.ts<br/>Type Definitions]
        C[config.ts<br/>Configuration]
        D[env.ts<br/>Environment]
        E[logger.ts<br/>Logging]
    end
    
    subgraph "Data Layer"
        F[sheetsClient.ts<br/>Read Jobs]
        G[sheetsWriter.ts<br/>Write Data]
        H[sheetsPayload.ts<br/>Data Formatting]
    end
    
    subgraph "AI Layer"
        I[geminiClient.ts<br/>API Client]
        J[geminiStubs.ts<br/>AI Calls]
    end
    
    subgraph "Contact Layer"
        K[contactsDiscovery.ts<br/>Hunter.io]
        L[contacts.ts<br/>Scoring & Filtering]
    end
    
    subgraph "Email Layer"
        M[emailPrompts.ts<br/>Prompt Building]
        N[emailOrchestrator.ts<br/>Email Generation]
        O[emailDrafts.ts<br/>Draft Creation]
        P[gmailClient.ts<br/>Gmail API]
    end
    
    subgraph "Utility Layer"
        Q[jdInsights.ts<br/>JD Analysis]
        R[paths.ts<br/>File Paths]
        S[rateLimiter.ts<br/>Rate Control]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> J
    A --> K
    A --> L
    A --> N
    A --> O
    A --> P
    A --> Q
    A --> R
    A --> S
    
    J --> I
    N --> M
    N --> J
    O --> B
    G --> H
    F --> B
    K --> B
    L --> B
```

---

## 📧 Email Sending Flow

### Detailed Email Pipeline

```mermaid
flowchart TD
    A[Contact Selected] --> B{Generate Email}
    B --> C[Build Prompt]
    C --> D[Call Gemini AI]
    D --> E{Parse Response}
    E -->|Success| F[Create Email Draft]
    E -->|Fail| G[Use Stub]
    G --> F
    F --> H{Check Rate Limits}
    H -->|Can Send| I[Wait if Needed]
    H -->|Cannot Send| J[Queue for Later]
    I --> K{SEND_EMAILS Enabled?}
    K -->|Yes| L[Send via Gmail API]
    K -->|No| M[Save as Draft]
    L --> N{Success?}
    N -->|Yes| O[Get Thread ID]
    N -->|No| P[Log Error]
    O --> Q[Update Sheets]
    P --> Q
    M --> Q
    Q --> R[Log Event]
    R --> S[Next Contact]
```

---

## 🔍 Contact Discovery & Scoring

### Contact Processing Pipeline

```mermaid
flowchart LR
    A[Job Domain] --> B[Hunter.io API]
    B --> C[Raw Contacts]
    C --> D[Filter by Title]
    D --> E[Normalize Contacts]
    E --> F[Score Contacts]
    F --> G[Sort by Score]
    G --> H[Apply Limits]
    H --> I[Selected Contacts]
    
    subgraph "Scoring Factors"
        F1[Role Match<br/>Weight: 40%]
        F2[Seniority<br/>Weight: 30%]
        F3[Team Function<br/>Weight: 20%]
        F4[Verification<br/>Weight: 10%]
    end
    
    F --> F1
    F --> F2
    F --> F3
    F --> F4
```

---

## 📊 Data Model

### Entity Relationship Diagram

```mermaid
erDiagram
    JOB ||--o{ CONTACT : "has"
    JOB ||--o{ EMAIL : "has"
    JOB ||--o{ EVENT : "has"
    CONTACT ||--o{ EMAIL : "receives"
    CONTACT ||--o{ EVENT : "triggers"
    EMAIL ||--o{ EVENT : "generates"
    
    JOB {
        string job_id PK
        string company
        string domain
        string job_title
        string jd_text
        string status
    }
    
    CONTACT {
        string contact_id PK
        string job_id FK
        string email
        string full_name
        string title
        int score
        string status
    }
    
    EMAIL {
        string email_id PK
        string contact_id FK
        string job_id FK
        string subject_used
        string body
        string sent_at
        string thread_id
        string status
    }
    
    EVENT {
        string event_id PK
        string contact_id FK
        string job_id FK
        string type
        string timestamp
        string payload_json
    }
```

---

## 🔐 Authentication Flow

### OAuth2 & API Key Flow

```mermaid
sequenceDiagram
    participant App
    participant Google as Google Cloud
    participant Gemini as Gemini API
    participant Hunter as Hunter.io
    participant Gmail as Gmail API
    
    Note over App: Environment Variables Setup
    
    App->>Google: Service Account JWT<br/>(Sheets API)
    Google-->>App: Access Token
    
    App->>Gemini: API Key<br/>(Content Generation)
    Gemini-->>App: API Access
    
    App->>Hunter: API Key<br/>(Contact Discovery)
    Hunter-->>App: API Access
    
    App->>Gmail: OAuth2 Refresh Token<br/>(Email Sending)
    Gmail-->>App: Access Token
    
    Note over App: All APIs Authenticated
```

---

## 🚀 Deployment Architecture

### Production Setup Options

```mermaid
graph TB
    subgraph "Option 1: Self-Hosted"
        A1[VPS Server<br/>DigitalOcean/AWS]
        A2[n8n Instance]
        A3[Node.js Pipeline]
        A1 --> A2
        A1 --> A3
    end
    
    subgraph "Option 2: Serverless"
        B1[n8n Cloud]
        B2[AWS Lambda<br/>Vercel Functions]
        B1 --> B2
    end
    
    subgraph "Option 3: Hybrid"
        C1[n8n Cloud]
        C2[VPS for Pipeline]
        C1 --> C2
    end
    
    subgraph "External Services"
        D1[Google Sheets<br/>Database]
        D2[Gemini AI<br/>Cloud]
        D3[Hunter.io<br/>Cloud]
        D4[Gmail API<br/>Cloud]
    end
    
    A2 --> D1
    A3 --> D1
    A3 --> D2
    A3 --> D3
    A3 --> D4
    
    B2 --> D1
    B2 --> D2
    B2 --> D3
    B2 --> D4
    
    C2 --> D1
    C2 --> D2
    C2 --> D3
    C2 --> D4
```

---

## 📈 Scalability Architecture

### Scaling Strategy

```mermaid
graph LR
    A[Current: Single Instance] --> B{Scale Needed?}
    B -->|Yes| C[Multiple Instances]
    B -->|No| A
    
    C --> D[Load Balancer]
    D --> E[Instance 1]
    D --> F[Instance 2]
    D --> G[Instance N]
    
    E --> H[Job Queue<br/>Redis/RabbitMQ]
    F --> H
    G --> H
    
    H --> I[Worker Pool]
    I --> J[Process Jobs]
    
    subgraph "Database Options"
        K[Google Sheets<br/>Current]
        L[PostgreSQL<br/>Future]
    end
    
    J --> K
    J --> L
```

---

## 🔄 n8n Workflow Structure

### Main Workflow Nodes

```mermaid
graph TD
    A[Cron Trigger<br/>Daily 10:00 AM] --> B[Read Jobs from Sheets]
    B --> C[Filter: status = ready]
    C --> D[Split in Batches]
    D --> E[For Each Job]
    E --> F[Build JobRow]
    F --> G[Execute Command<br/>npm run pipeline]
    G --> H{Success?}
    H -->|Yes| I[Update Status = completed]
    H -->|No| J[Update Status = error]
    I --> K[Next Job]
    J --> K
    K --> L{More Jobs?}
    L -->|Yes| E
    L -->|No| M[End]
```

---

## 📝 Summary

These diagrams show:

1. **High-Level Architecture** - Overall system structure
2. **Data Flow** - How data moves through the system
3. **Component Dependencies** - Module relationships
4. **Email Pipeline** - Detailed email sending flow
5. **Contact Processing** - Discovery and scoring
6. **Data Model** - Entity relationships
7. **Authentication** - API access patterns
8. **Deployment Options** - Production setups
9. **Scaling Strategy** - Growth path
10. **n8n Workflow** - Orchestration structure

All diagrams use **Mermaid** syntax and can be rendered in:
- GitHub (native support)
- Markdown viewers
- Documentation sites
- Mermaid Live Editor

