# ReferrAI Project Structure

This document explains the organization of the ReferrAI repository.

## 📁 Directory Structure

```
ReferrAI/
├── 📄 README.md                    # Main project documentation
├── 📄 LICENSE                      # MIT License
├── 📄 PROJECT_STRUCTURE.md         # This file - explains organization
├── 📄 CONTRIBUTING.md              # Contribution guidelines
├── 📄 .env.example                 # Environment variables template
│
├── 📄 package.json                 # ⚠️ MUST stay in root (Node.js requirement)
├── 📄 package-lock.json            # ⚠️ MUST stay in root (npm requirement)
├── 📄 tsconfig.json                # ⚠️ MUST stay in root (TypeScript requirement)
│
├── 📁 src/                         # Main Node.js pipeline source code
│   ├── generateApplicationForJob.ts  # CLI entry point
│   ├── jobPipeline.ts              # Full pipeline orchestrator
│   ├── geminiClient.ts             # Gemini AI integration
│   ├── contactsDiscovery.ts        # Contact discovery (Hunter.io, etc.)
│   ├── gmailClient.ts              # Gmail API integration
│   ├── sheetsClient.ts             # Google Sheets integration
│   └── ...                         # Other pipeline modules
│
├── 📁 website/                     # Next.js web application
│   ├── 📄 package.json             # Website dependencies
│   ├── 📄 README.md                # Website-specific documentation
│   ├── 📁 app/                     # Next.js App Router
│   │   ├── page.tsx                # Home page
│   │   └── api/                    # API routes (server-side)
│   ├── 📁 components/              # React components
│   ├── 📁 lib/                     # Utility libraries
│   └── 📁 public/                  # Static assets
│
├── 📁 docs/                        # Documentation
│   ├── ARCHITECTURE_DIAGRAM.md     # System architecture diagrams
│   ├── PROJECT_DOCUMENTATION.md     # Comprehensive project docs
│   ├── API_KEYS_SUMMARY.md          # All API keys reference
│   ├── SECURITY.md                  # Security best practices
│   ├── TESTING_GUIDE.md             # Testing instructions
│   ├── n8n-function-nodes.md       # n8n workflow code snippets
│   └── 📁 website/                 # Website-specific docs
│       ├── README.md                # Website overview
│       ├── QUICK_START.md           # Quick start guide
│       ├── APOLLO_SETUP.md          # Apollo.io setup
│       ├── JSEARCH_SETUP.md         # JSearch API setup
│       └── FEATURES.md              # Website features list
│
├── 📁 n8n/                         # n8n workflow definitions
│   ├── README.md                   # n8n workflow documentation
│   ├── referral-engine-main.json   # Main daily workflow
│   └── referral-reply-monitor.json # Gmail reply monitor workflow
│
├── 📁 scripts/                     # Utility scripts
│   ├── extract_sheet_id.sh         # Extract Google Sheets ID from URL
│   ├── fix_private_key.sh           # Fix private key format helper
│   └── test-gemini-models.js        # Test Gemini API models
│
└── 📁 outputs/                     # Generated files (gitignored)
    └── {company}/{job_id}/          # Resume & cover letter outputs
```

## 🎯 Project Components

### 1. **Main Pipeline** (`src/`)
The core Node.js application that:
- Reads jobs from Google Sheets
- Generates customized resumes and cover letters
- Discovers contacts via APIs
- Creates referral email drafts
- Can be run as CLI or integrated into n8n

**Entry Point:** `npm run pipeline <jobId>`

### 2. **Website** (`website/`)
Production-grade Next.js web application that:
- Provides a UI for searching companies and roles
- Discovers contacts (recruiters, domain employees)
- Finds job openings
- Generates resumes, cover letters, and emails using AI
- Sends emails via Gmail API

**Entry Point:** `cd website && npm run dev`

### 3. **Documentation** (`docs/`)
Comprehensive documentation covering:
- Architecture and design decisions
- API key setup and security
- Testing procedures
- n8n integration guides

### 4. **n8n Workflows** (`n8n/`)
Pre-built n8n workflows for:
- Daily job processing automation
- Gmail reply monitoring

### 5. **Scripts** (`scripts/`)
Helper scripts for:
- Setting up Google Sheets
- Testing API integrations
- Common development tasks

## 📚 Documentation Guide

### For New Users
1. Start with **README.md** - Overview of the project
2. Read **docs/website/QUICK_START.md** - Get the website running
3. Check **docs/API_KEYS_SUMMARY.md** - Set up required API keys

### For Developers
1. **docs/PROJECT_DOCUMENTATION.md** - Complete technical documentation
2. **docs/ARCHITECTURE_DIAGRAM.md** - System architecture
3. **docs/TESTING_GUIDE.md** - How to test components

### For n8n Integration
1. **n8n/README.md** - n8n workflow documentation
2. **docs/n8n-function-nodes.md** - Code snippets for n8n

## 🔑 Environment Variables

All environment variables are stored in `.env` files (gitignored).

**Main Project:** `.env` (root directory)
**Website:** `website/.env.local`

See **docs/API_KEYS_SUMMARY.md** for complete list.

## 🚀 Quick Start

### Main Pipeline
```bash
npm install
npm run pipeline <jobId>
```

### Website
```bash
cd website
npm install
npm run dev
```

See **docs/website/QUICK_START.md** for detailed setup.

## ⚠️ Files That Must Stay in Root

These files are **required** to be in the root directory by their respective tools:

- **`package.json`** - Node.js/npm requires this in root to identify the project
- **`package-lock.json`** - npm lockfile, must be alongside package.json
- **`tsconfig.json`** - TypeScript compiler looks for this in root by default
- **`.env.example`** - Standard location for environment variable templates
- **`.gitignore`** - Git requires this in root

These are **not clutter** - they're essential configuration files that tools expect in the root.

## 📝 File Naming Conventions

- **Documentation:** UPPERCASE with underscores (e.g., `API_KEYS_SUMMARY.md`)
- **Source Code:** camelCase (e.g., `geminiClient.ts`)
- **Components:** PascalCase (e.g., `EmailComposer.tsx`)
- **Config Files:** lowercase (e.g., `package.json`, `.env`)

## 🗂️ What Goes Where?

- **Root level:** Only essential files (README, LICENSE, config files)
- **`src/`:** Main pipeline source code
- **`website/`:** Complete Next.js application
- **`docs/`:** All documentation
- **`n8n/`:** Workflow definitions
- **`scripts/`:** Utility scripts
- **`outputs/`:** Generated files (gitignored)

## 🔄 Maintenance

- Keep documentation in `docs/`
- Add new scripts to `scripts/`
- Website-specific docs go in `docs/website/`
- Update this file when structure changes

