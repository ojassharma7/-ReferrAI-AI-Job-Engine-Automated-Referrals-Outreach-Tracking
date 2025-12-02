# API Setup Guide - Step by Step

## 🎯 Quick Setup Checklist

- [ ] Google Sheets API
- [ ] Gemini API
- [ ] Hunter.io API
- [ ] Gmail API (do this last!)

---

## 1️⃣ Google Sheets API Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google Sheets API"

### Step 2: Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name it (e.g., "referrai-sheets")
4. Click "Create and Continue" > "Done"

### Step 3: Create and Download Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### Step 4: Extract Credentials
Open the downloaded JSON file and copy:
- `client_email` → `GOOGLE_SHEETS_CLIENT_EMAIL`
- `private_key` → `GOOGLE_SHEETS_PRIVATE_KEY` (keep the `\n` characters)

### Step 5: Get Spreadsheet ID
1. Open your Google Sheet
2. URL looks like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy `SPREADSHEET_ID` → `GOOGLE_SHEETS_SPREADSHEET_ID`

### Step 6: Share Sheet with Service Account
1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (from Step 4)
4. Give it "Editor" access
5. Click "Send"

### Step 7: Add to .env
```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Test:
```bash
npm run test:sheets
```

---

## 2️⃣ Gemini API Setup

### Step 1: Get API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key

### Step 2: Add to .env
```env
GEMINI_API_KEY=your_api_key_here
USE_GEMINI=true
GEMINI_MODEL=gemini-pro
```

### Test:
```bash
npm run pipeline test-gemini-001
```

---

## 3️⃣ Hunter.io API Setup

### Step 1: Sign Up
1. Go to [Hunter.io](https://hunter.io)
2. Sign up for a free account
3. Go to [API Dashboard](https://hunter.io/api-dashboard)

### Step 2: Get API Key
1. Copy your API key from the dashboard
2. Free tier: 25 searches/month

### Step 3: Add to .env
```env
HUNTER_API_KEY=your_hunter_api_key_here
```

### Test:
```bash
npm run pipeline test-hunter-001
```

---

## 4️⃣ Gmail API Setup (⚠️ Do This Last!)

### Step 1: Enable Gmail API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Same project as Sheets (or create new)
3. Enable "Gmail API"

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - Choose "External"
   - Fill in app name, support email
   - Add scope: `https://www.googleapis.com/auth/gmail.send`
   - Add your email as test user
   - Save
4. Back to Credentials, create OAuth client ID:
   - **Application type: "Web application"** (NOT Desktop app - this allows custom redirect URIs)
   - Name: "ReferrAI Gmail Web"
   - Under "Authorized redirect URIs", click "+ ADD URI"
   - Add: `https://developers.google.com/oauthplayground`
   - Click "Create"
5. Copy Client ID and Client Secret

### Step 3: Get Refresh Token
1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click gear icon (⚙️) in top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In left panel, find "Gmail API v1"
6. Select `https://www.googleapis.com/auth/gmail.send`
7. Click "Authorize APIs"
8. Sign in with your Gmail account
9. Click "Exchange authorization code for tokens"
10. Copy the "Refresh token"

### Step 4: Add to .env
```env
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_FROM_EMAIL=your-email@gmail.com
SEND_EMAILS=false  # Keep false until ready to test!
```

### Test (with SEND_EMAILS=false first):
```bash
npm run pipeline test-gmail-001
```

### When Ready to Send Real Emails:
```env
SEND_EMAILS=true  # ⚠️ This will send REAL emails!
```

---

## 🧪 Testing Order

1. ✅ **Google Sheets** - `npm run test:sheets`
2. ✅ **Gemini API** - `npm run pipeline test-gemini-001`
3. ✅ **Hunter.io** - `npm run pipeline test-hunter-001`
4. ⚠️ **Gmail** - `npm run pipeline test-gmail-001` (with SEND_EMAILS=false first!)

---

## 💡 Tips

- Test one API at a time
- Keep `SEND_EMAILS=false` until you're 100% ready
- Check logs for any errors
- Start with test job IDs before using real ones

