# ReferrAI Website Features

## ✅ Completed Features

### 1. Contact Discovery
- **Apollo.io Integration** - Primary contact discovery source
- **Hunter.io Fallback** - Automatic fallback when Apollo.io is unavailable
- **Company Lookup** - Get company information and domain
- **Recruiter Search** - Find recruiters, hiring managers, talent acquisition
- **Domain Employee Search** - Find employees in specific job roles
- **Email Verification** - Shows verified/likely/unverified status
- **Relevance Scoring** - Scores contacts based on job role match

### 2. Job Search Integration
- **JSearch API** - Search across multiple job boards (LinkedIn, Indeed, Glassdoor)
- **Job Filtering** - Automatically filters results to match company
- **Job Details** - Shows job title, location, type, description, and posting date
- **Direct Apply Links** - Links to original job postings

### 3. AI-Powered Resume Generation
- **Gemini AI Integration** - Uses Google Gemini for intelligent customization
- **Job-Specific Customization** - Tailors resume to match job requirements
- **Keyword Optimization** - Highlights relevant skills and experience
- **Download Support** - Download generated resume as text file
- **Base Resume Input** - Paste your existing resume for customization

### 4. AI-Powered Cover Letter Generation
- **Personalized Content** - Generates cover letters based on job and profile
- **Candidate Profile Integration** - Uses your background for personalization
- **Contact Name Support** - Can address specific contacts
- **Download Support** - Download generated cover letter as text file

### 5. AI-Powered Email Composer
- **Referral Email Generation** - Creates personalized referral request emails
- **Two Subject Line Options** - Choose between two AI-generated subject lines
- **Proof Point Integration** - Include quantified achievements
- **Contact-Specific** - Personalized for each contact
- **Gmail Integration** - Send emails directly via Gmail API

### 6. Email Sending
- **Gmail API Integration** - Send emails through your Gmail account
- **OAuth 2.0 Authentication** - Secure email sending
- **Thread Tracking** - Returns Gmail thread ID for tracking
- **Error Handling** - Graceful error messages if Gmail not configured

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface with Tailwind CSS
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Tabbed Interface** - Easy navigation between Recruiters, Employees, and Jobs
- **Contact Cards** - Beautiful cards showing contact information
- **Email Status Badges** - Visual indicators for email verification
- **Loading States** - Clear feedback during API calls
- **Error Messages** - Helpful error messages with suggestions
- **Dialog Modals** - Clean modals for resume/cover letter/email generation

## 🔧 Technical Features

- **Next.js 16** - Modern React framework with App Router
- **TypeScript** - Full type safety
- **Server-Side API Routes** - Secure API key handling
- **Environment Variables** - Secure credential management
- **Error Handling** - Comprehensive error handling throughout
- **Graceful Degradation** - Features work even if some APIs are unavailable

## 📋 Required API Keys

1. **APOLLO_API_KEY** - Contact discovery (required)
2. **HUNTER_API_KEY** - Fallback contact discovery (optional)
3. **JSEARCH_API_KEY** - Job search (optional)
4. **GEMINI_API_KEY** - AI generation (optional, but recommended)
5. **GMAIL_CLIENT_ID** - Email sending (optional)
6. **GMAIL_CLIENT_SECRET** - Email sending (optional)
7. **GMAIL_REFRESH_TOKEN** - Email sending (optional)

## 🚀 How to Use

1. **Search for Company & Role**
   - Enter company name and job role
   - Click "Search"
   - View contacts and jobs

2. **Enter Your Profile** (Optional)
   - Fill in your background/experience
   - This helps AI generate better content

3. **Generate Resume**
   - Click "Generate Resume" button
   - Paste your base resume
   - Add optional keywords
   - Click "Generate Customized Resume"
   - Download the result

4. **Generate Cover Letter**
   - Click "Generate Cover Letter" button
   - Enter your candidate profile
   - Click "Generate Cover Letter"
   - Download the result

5. **Send Referral Email**
   - Click "Send Email" on any contact card
   - Optionally add a proof point
   - Click "Generate Email with AI"
   - Choose subject line variant
   - Click "Send Email"

## 🎯 Next Steps (Future Enhancements)

- [ ] Resume/cover letter PDF generation
- [ ] Email templates library
- [ ] Email scheduling
- [ ] Contact notes and follow-up tracking
- [ ] Analytics dashboard
- [ ] Bulk email sending
- [ ] Email reply monitoring
- [ ] Integration with Google Sheets for tracking



