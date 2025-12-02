# ReferrAI Website - Complete Roadmap

## 🎯 Product Vision

A production-grade SaaS platform where users can:
1. Search for companies and job roles
2. Discover contacts (recruiters + domain-specific employees)
3. View job openings with JDs
4. Generate customized resumes and cover letters
5. Send referral emails automatically

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up project structure and basic infrastructure

#### Week 1: Project Setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Configure project structure (frontend/backend separation)
- [ ] Set up environment variables
- [ ] Initialize Git repository
- [ ] Set up database (PostgreSQL with Prisma)
- [ ] Set up Redis for caching
- [ ] Configure deployment (Vercel + Railway)

#### Week 2: Authentication & Core UI
- [ ] Implement authentication (NextAuth.js)
- [ ] Create landing page
- [ ] Build search interface (company + role input)
- [ ] Set up API routes structure
- [ ] Create basic dashboard layout
- [ ] Set up error handling and logging

**Deliverable:** Working frontend with search interface, no backend yet

---

### Phase 2: Backend API & Apollo Integration (Week 3-4)
**Goal:** Build backend API and integrate Apollo.io

#### Week 3: Apollo.io Integration
- [ ] Sign up for Apollo.io FREE tier
- [ ] Get API key
- [ ] Create Apollo.io API client
- [ ] Implement company lookup
- [ ] Implement contact discovery endpoint
- [ ] Add email verification
- [ ] Implement caching (Redis)
- [ ] Add rate limiting

#### Week 4: Backend API Development
- [ ] Create RESTful API structure
- [ ] Implement search endpoint (`/api/search`)
- [ ] Implement contact discovery endpoint (`/api/contacts`)
- [ ] Implement job search endpoint (`/api/jobs`)
- [ ] Add database models (Prisma)
- [ ] Implement data persistence
- [ ] Add error handling
- [ ] Write API tests

**Deliverable:** Working backend API with Apollo.io integration

---

### Phase 3: Frontend Features (Week 5-6)
**Goal:** Build main user-facing features

#### Week 5: Search & Results
- [ ] Build search results page
- [ ] Create contact cards component
- [ ] Implement filtering (recruiters vs domain-specific)
- [ ] Add sorting and pagination
- [ ] Create contact detail modal
- [ ] Add export functionality
- [ ] Implement loading states
- [ ] Add error states

#### Week 6: Job Search Integration
- [ ] Integrate job board APIs (LinkedIn, Indeed)
- [ ] Create job listings component
- [ ] Build job detail view
- [ ] Add JD display
- [ ] Implement job filtering
- [ ] Add save job functionality

**Deliverable:** Complete search and discovery interface

---

### Phase 4: AI Content Generation (Week 7-8)
**Goal:** Integrate Gemini AI for resume/cover letter generation

#### Week 7: Resume Generation
- [ ] Create resume upload component
- [ ] Integrate Gemini AI API
- [ ] Build resume customization logic
- [ ] Create resume preview
- [ ] Add download functionality (PDF, DOCX)
- [ ] Implement ATS optimization
- [ ] Add keyword matching report

#### Week 8: Cover Letter Generation
- [ ] Create cover letter generator
- [ ] Integrate Gemini AI
- [ ] Build proof points input
- [ ] Create cover letter preview
- [ ] Add download functionality
- [ ] Implement personalization
- [ ] Add multiple variants (A/B testing)

**Deliverable:** Complete document generation system

---

### Phase 5: Email System (Week 9-10)
**Goal:** Build email composer and sending system

#### Week 9: Email Composer
- [ ] Create email composer UI
- [ ] Integrate Gemini AI for email generation
- [ ] Build contact selection
- [ ] Add email templates
- [ ] Implement personalization
- [ ] Create email preview
- [ ] Add attachment support

#### Week 10: Email Sending & Tracking
- [ ] Integrate Gmail API
- [ ] Implement email sending
- [ ] Add rate limiting
- [ ] Create email tracking
- [ ] Build email status dashboard
- [ ] Add reply monitoring
- [ ] Implement follow-up sequences

**Deliverable:** Complete email automation system

---

### Phase 6: User Dashboard & Polish (Week 11-12)
**Goal:** Build user dashboard and polish the product

#### Week 11: User Dashboard
- [ ] Create dashboard layout
- [ ] Build analytics components
- [ ] Add saved searches
- [ ] Create document history
- [ ] Build email campaign tracking
- [ ] Add user settings
- [ ] Implement billing (Stripe)

#### Week 12: Polish & Testing
- [ ] Mobile responsive design
- [ ] Dark mode
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] User testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Deployment

**Deliverable:** Production-ready product

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** Zustand or React Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Next.js API Routes (or Express)
- **Database:** PostgreSQL (Supabase/Neon)
- **ORM:** Prisma
- **Cache:** Redis (Upstash)
- **Queue:** BullMQ or Inngest

### APIs
- **Contact Discovery:** Apollo.io (FREE tier)
- **AI Generation:** Gemini AI
- **Email Sending:** Gmail API
- **Job Search:** LinkedIn API, Indeed API

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Railway or Render
- **Database:** Supabase or Neon
- **Cache:** Upstash Redis
- **Storage:** AWS S3 or Cloudinary
- **Monitoring:** Sentry

---

## 📁 Project Structure

```
referrai-website/
├── frontend/                 # Next.js app
│   ├── app/                  # App router pages
│   │   ├── (auth)/          # Auth pages
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── search/          # Search pages
│   │   └── api/             # API routes
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── search/          # Search components
│   │   ├── contacts/        # Contact components
│   │   └── documents/       # Document components
│   ├── lib/                 # Utilities
│   │   ├── apollo/          # Apollo.io client
│   │   ├── gemini/          # Gemini AI client
│   │   └── utils/           # Helper functions
│   └── types/               # TypeScript types
│
├── backend/                  # Backend API (if separate)
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   └── utils/           # Utilities
│   └── prisma/              # Prisma schema
│
├── shared/                   # Shared code
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Shared utilities
│
└── docs/                     # Documentation
```

---

## 🚀 Getting Started

### Step 1: Initialize Project

```bash
# Create Next.js project
npx create-next-app@latest referrai-website --typescript --tailwind --app

# Install dependencies
cd referrai-website
npm install @prisma/client prisma
npm install zod react-hook-form @hookform/resolvers
npm install zustand
npm install @apollo/client graphql
npm install @google/generative-ai
npm install googleapis
npm install @upstash/redis
npm install @radix-ui/react-*  # For shadcn/ui
```

### Step 2: Set Up shadcn/ui

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog
```

### Step 3: Set Up Database

```bash
# Initialize Prisma
npx prisma init

# Create schema
# Set up Supabase or Neon PostgreSQL
```

### Step 4: Environment Variables

```env
# Apollo.io
APOLLO_API_KEY=your_apollo_api_key

# Gemini AI
GEMINI_API_KEY=your_gemini_key
USE_GEMINI=true

# Database
DATABASE_URL=your_postgres_url

# Redis
REDIS_URL=your_redis_url

# Gmail (later)
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## 📋 Feature Checklist

### MVP Features (Phase 1-3)
- [ ] Company + Role search
- [ ] Contact discovery (Apollo.io)
- [ ] Recruiters filtering
- [ ] Domain-specific filtering
- [ ] Contact cards display
- [ ] Job search integration
- [ ] Basic user dashboard

### Core Features (Phase 4-5)
- [ ] Resume generation (Gemini)
- [ ] Cover letter generation (Gemini)
- [ ] Email composer
- [ ] Email sending (Gmail)
- [ ] Email tracking

### Advanced Features (Phase 6)
- [ ] Analytics dashboard
- [ ] Saved searches
- [ ] Document history
- [ ] Team collaboration
- [ ] Billing integration

---

## 🎯 Success Metrics

### Technical
- Page load time < 2s
- API response time < 500ms
- 99.9% uptime
- Zero critical bugs

### Product
- User signups
- Searches per user
- Documents generated
- Emails sent
- User retention

---

## 📝 Next Steps

1. **Initialize Next.js project** ✅ (We'll do this now)
2. **Set up Apollo.io integration** (Week 3)
3. **Build search interface** (Week 5)
4. **Add AI generation** (Week 7)
5. **Implement email system** (Week 9)
6. **Polish and launch** (Week 12)

---

Let's start building! 🚀

