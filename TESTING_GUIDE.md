# ReferrAI Testing Guide

## Quick Start Testing

### Step 1: Set Up Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys (you can add them one at a time as you test)

### Step 2: Test Each Component

#### Test 1: Google Sheets Integration
```bash
# Set these in .env:
# GOOGLE_SHEETS_SPREADSHEET_ID=your_id
# GOOGLE_SHEETS_CLIENT_EMAIL=your_email
# GOOGLE_SHEETS_PRIVATE_KEY="your_key"

npm run test:sheets
```

**Expected:** Should list jobs from your Google Sheet

#### Test 2: Gemini API (AI Content Generation)
```bash
# Set these in .env:
# GEMINI_API_KEY=your_key
# USE_GEMINI=true

npm run pipeline test-job-003
```

**Expected:** Should generate real AI content instead of stubs

#### Test 3: Hunter.io (Contact Discovery)
```bash
# Set this in .env:
# HUNTER_API_KEY=your_key

npm run pipeline test-job-004
```

**Expected:** Should discover real contacts from company domains

#### Test 4: Gmail (Email Sending) - ⚠️ Test Last!
```bash
# Set these in .env:
# GMAIL_CLIENT_ID=your_id
# GMAIL_CLIENT_SECRET=your_secret
# GMAIL_REFRESH_TOKEN=your_token
# SEND_EMAILS=true  # ⚠️ This will send REAL emails!

npm run pipeline test-job-005
```

**Expected:** Should send real emails (be careful!)

## Testing Order

1. ✅ **Google Sheets** - Safest, just reads data
2. ✅ **Gemini API** - Safe, generates content
3. ✅ **Hunter.io** - Safe, just discovers contacts
4. ⚠️ **Gmail** - **LAST!** This sends real emails

## Current Status

Right now, everything works with **stubbed data** (no API keys needed). This is perfect for:
- Testing the pipeline flow
- Verifying file generation
- Checking the logic

When you're ready to test with real APIs, follow the steps above!

