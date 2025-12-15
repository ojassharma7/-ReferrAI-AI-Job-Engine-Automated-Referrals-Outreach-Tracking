# ReferrAI Website

Production-grade web application for discovering contacts, finding jobs, and automating referral outreach.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Apollo.io account (FREE tier)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local .env
# Edit .env and add your APOLLO_API_KEY

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Get Apollo.io API Key (FREE)

1. Sign up at [Apollo.io](https://www.apollo.io/) (FREE tier)
2. Go to Settings → Integrations → API Keys
3. Create new API key
4. Add to `.env`: `APOLLO_API_KEY=your_key`

**FREE Tier Includes:**
- 10,000 email credits/month
- Contact discovery
- Email verification
- API access

## 📁 Project Structure

```
referrai-website/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   └── search/        # Search endpoint
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── search/           # Search components
│   ├── contacts/         # Contact components
│   └── results/           # Results components
├── lib/                   # Utilities
│   ├── apollo-client.ts  # Apollo.io integration
│   └── types.ts          # TypeScript types
└── public/               # Static assets
```

## 🎯 Features

### ✅ Implemented

- Company + Role search
- Contact discovery (Apollo.io)
- Recruiters filtering
- Domain-specific employee filtering
- Contact cards with verification status
- Results dashboard with tabs
- Responsive design

### 🚧 Coming Soon

- Job search integration
- Resume generation (Gemini AI)
- Cover letter generation (Gemini AI)
- Email composer
- Email sending (Gmail API)
- User authentication
- Dashboard & analytics

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State**: React hooks
- **API**: Apollo.io (FREE tier)

## 📚 Documentation

- [ROADMAP.md](./ROADMAP.md) - Complete development roadmap
- [APOLLO_SETUP.md](./APOLLO_SETUP.md) - Apollo.io setup guide
- [PRODUCTION_ARCHITECTURE.md](../-ReferrAI-AI-Job-Engine-Automated-Referrals-Outreach-Tracking/PRODUCTION_ARCHITECTURE.md) - Production architecture

## 🧪 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## 🔧 Environment Variables

See `.env.local` for all required variables.

**Required for MVP:**
- `APOLLO_API_KEY` - Apollo.io API key (FREE)

**Optional (for future features):**
- `GEMINI_API_KEY` - For AI content generation
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis cache
- `GMAIL_*` - Email sending

## 📊 Current Status

**Phase 1: Foundation** ✅
- Project setup
- Basic UI
- Search interface
- Apollo.io integration

**Next: Phase 2**
- Job search integration
- AI content generation
- Email system

## 🎯 Roadmap

See [ROADMAP.md](./ROADMAP.md) for complete 12-week development plan.

---

Built with ❤️ for production-grade job referral automation.
