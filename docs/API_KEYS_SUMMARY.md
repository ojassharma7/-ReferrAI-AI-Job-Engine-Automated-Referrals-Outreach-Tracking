# 📋 API Keys & Credentials Summary

## 🔑 Total: **11 API Keys & Credentials**

---

## 1️⃣ **GEMINI_API_KEY**
- **Purpose:** AI content generation (resume customization, cover letters, emails)
- **Location:** 
  - Main project: `src/geminiClient.ts`
  - Used when: `USE_GEMINI=true`
- **Where to get:** [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Required:** Optional (falls back to stubs if not set)

---

## 2️⃣ **APOLLO_API_KEY**
- **Purpose:** Contact discovery (company lookup, people search)
- **Location:** 
  - Website: `website/lib/apollo-client.ts`
  - Website: `website/lib/apollo-client-v2.ts`
- **Where to get:** [Apollo.io](https://apollo.io) (FREE tier available)
- **Required:** Yes (for website contact discovery)

---

## 3️⃣ **HUNTER_API_KEY**
- **Purpose:** Contact discovery & email verification (fallback for Apollo)
- **Location:** 
  - Main project: `src/contactsDiscovery.ts`
  - Website: `website/lib/hunter-client.ts`
- **Where to get:** [Hunter.io](https://hunter.io)
- **Required:** Optional (used as fallback)

---

## 4️⃣ **JOBRIGHTS_API_KEY**
- **Purpose:** Job search API (alternative contact discovery)
- **Location:** `src/contactsDiscovery.ts`
- **Where to get:** [JobRights API](https://api.jobrights.io)
- **Required:** Optional (not currently used)

---

## 5️⃣ **JSEARCH_API_KEY**
- **Purpose:** Job search for website (find job openings)
- **Location:** `website/lib/job-search-client.ts`
- **Where to get:** [RapidAPI JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) (FREE tier available)
- **Required:** Optional (job search will be skipped if not set)

---

## 6️⃣ **GMAIL_CLIENT_ID**
- **Purpose:** Gmail OAuth authentication
- **Location:** `src/gmailClient.ts`
- **Where to get:** [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0 Client ID
- **Required:** Yes (for sending emails)

---

## 7️⃣ **GMAIL_CLIENT_SECRET**
- **Purpose:** Gmail OAuth authentication
- **Location:** `src/gmailClient.ts`
- **Where to get:** Same as GMAIL_CLIENT_ID (comes in pair)
- **Required:** Yes (for sending emails)

---

## 8️⃣ **GMAIL_REFRESH_TOKEN**
- **Purpose:** Gmail OAuth token refresh
- **Location:** `src/gmailClient.ts`
- **Where to get:** [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- **Required:** Yes (for sending emails)

---

## 9️⃣ **GOOGLE_SHEETS_SPREADSHEET_ID**
- **Purpose:** Google Sheets data storage
- **Location:** 
  - `src/sheetsClient.ts`
  - `src/sheetsWriter.ts`
- **Where to get:** From Google Sheets URL (between `/d/` and `/edit`)
- **Required:** Optional (falls back to stubs if not set)

---

## 🔟 **GOOGLE_SHEETS_CLIENT_EMAIL**
- **Purpose:** Google Sheets service account authentication
- **Location:** 
  - `src/sheetsClient.ts`
  - `src/sheetsWriter.ts`
- **Where to get:** From service account JSON file (from Google Cloud Console)
- **Required:** Optional (needed if using Google Sheets)

---

## 1️⃣1️⃣ **GOOGLE_SHEETS_PRIVATE_KEY**
- **Purpose:** Google Sheets service account authentication
- **Location:** 
  - `src/sheetsClient.ts`
  - `src/sheetsWriter.ts`
- **Where to get:** From service account JSON file (from Google Cloud Console)
- **Required:** Optional (needed if using Google Sheets)

---

## 📊 Summary by Project

### Main Project (Node.js Pipeline)
- ✅ GEMINI_API_KEY
- ✅ HUNTER_API_KEY
- ✅ JOBRIGHTS_API_KEY (optional)
- ✅ GMAIL_CLIENT_ID
- ✅ GMAIL_CLIENT_SECRET
- ✅ GMAIL_REFRESH_TOKEN
- ✅ GOOGLE_SHEETS_SPREADSHEET_ID
- ✅ GOOGLE_SHEETS_CLIENT_EMAIL
- ✅ GOOGLE_SHEETS_PRIVATE_KEY

**Total: 9 credentials**

### Website Project (Next.js)
- ✅ APOLLO_API_KEY
- ✅ HUNTER_API_KEY (optional fallback)
- ✅ JSEARCH_API_KEY (optional, for job search)

**Total: 1-3 credentials**

---

## 🎯 Required vs Optional

### **Required for Full Functionality:**
1. GEMINI_API_KEY (if using AI features)
2. APOLLO_API_KEY (for website)
3. GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN (for email sending)

### **Optional (with fallbacks):**
- HUNTER_API_KEY (fallback for Apollo)
- JSEARCH_API_KEY (for job search on website)
- GOOGLE_SHEETS_* (falls back to stubs)
- JOBRIGHTS_API_KEY (not currently used)

---

## 💡 Quick Setup Checklist

- [ ] GEMINI_API_KEY (for AI)
- [ ] APOLLO_API_KEY (for website)
- [ ] HUNTER_API_KEY (optional fallback)
- [ ] JSEARCH_API_KEY (optional, for job search)
- [ ] GMAIL_CLIENT_ID + SECRET + REFRESH_TOKEN (for emails)
- [ ] GOOGLE_SHEETS_* (optional, for persistence)

---

**Last Updated:** December 2024



