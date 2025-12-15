# 🔒 API Key Security Guide

## ✅ Current Security Measures

### 1. **Environment Variables in .gitignore**
- ✅ `.env` files are excluded from Git
- ✅ `.env.local` files are excluded from Git
- ✅ All `.env*` patterns are ignored (website project)

**Status:** ✅ **SECURE** - API keys are NOT committed to Git

---

### 2. **Server-Side Only Access**
- ✅ API keys are accessed via `process.env` (server-side only)
- ✅ No `NEXT_PUBLIC_` prefixes (which would expose keys to client)
- ✅ Next.js API routes run on server (keys never sent to browser)
- ✅ Node.js pipeline runs server-side only

**Status:** ✅ **SECURE** - Keys never exposed to client-side code

---

### 3. **API Key Usage Locations**

#### Main Project (Node.js)
- `src/geminiClient.ts` - Uses `GEMINI_API_KEY`
- `src/contactsDiscovery.ts` - Uses `HUNTER_API_KEY`, `JOBRIGHTS_API_KEY`
- `src/gmailClient.ts` - Uses `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- `src/sheetsClient.ts` - Uses `GOOGLE_SHEETS_*` credentials

#### Website Project (Next.js)
- `website/lib/apollo-client.ts` - Uses `APOLLO_API_KEY` (server-side only)
- `website/lib/hunter-client.ts` - Uses `HUNTER_API_KEY` (server-side only)
- `website/app/api/search/route.ts` - Server-side API route (keys never exposed)

**Status:** ✅ **SECURE** - All keys accessed server-side only

---

## ⚠️ Security Recommendations

### 1. **Create .env.example Files**

Create example files to guide users without exposing real keys:

```bash
# Main project
.env.example
# Website project  
website/.env.example
```

**Action Required:** Create these files (see below)

---

### 2. **Add Rate Limiting**

Protect API endpoints from abuse:

```typescript
// website/app/api/search/route.ts
// Add rate limiting middleware
```

**Action Required:** Implement rate limiting for production

---

### 3. **Environment Variable Validation**

Add validation on startup:

```typescript
// Validate all required keys are present
// Throw clear errors if missing
```

**Status:** ✅ Partially implemented in `src/env.ts`

---

### 4. **API Key Rotation**

- Document how to rotate keys
- Add warnings for expired keys
- Monitor API usage

**Action Required:** Add rotation documentation

---

### 5. **Never Log API Keys**

✅ **Current Status:** Good - No keys logged in code

**Best Practice:**
```typescript
// ❌ BAD
console.log('API Key:', process.env.APOLLO_API_KEY);

// ✅ GOOD
console.log('API Key:', process.env.APOLLO_API_KEY ? '***SET***' : 'NOT SET');
```

---

### 6. **Production Environment Variables**

For production deployments (Vercel, Railway, etc.):

- ✅ Use platform's environment variable settings
- ✅ Never commit `.env` files
- ✅ Use different keys for dev/staging/prod
- ✅ Rotate keys regularly

---

## 🚨 Security Checklist

### Before Committing Code:
- [ ] No `.env` files in Git
- [ ] No API keys in code comments
- [ ] No keys in console.log statements
- [ ] No keys in error messages
- [ ] `.gitignore` includes `.env*`

### Before Deploying:
- [ ] All keys set in production environment
- [ ] Different keys for production vs development
- [ ] Rate limiting enabled
- [ ] API usage monitoring enabled
- [ ] Error logging doesn't expose keys

### Regular Maintenance:
- [ ] Rotate API keys quarterly
- [ ] Review API usage logs
- [ ] Check for unauthorized access
- [ ] Update dependencies (security patches)

---

## 📋 Current Security Status

| Security Measure | Status | Notes |
|-----------------|--------|-------|
| `.env` in `.gitignore` | ✅ | Both projects |
| Server-side only access | ✅ | No client exposure |
| No `NEXT_PUBLIC_` keys | ✅ | Safe |
| API routes server-side | ✅ | Next.js API routes |
| Key validation | ⚠️ | Partial (main project) |
| Rate limiting | ❌ | Not implemented |
| `.env.example` files | ❌ | Should create |
| Key rotation docs | ❌ | Should add |

---

## 🔧 Immediate Actions Needed

1. **Create `.env.example` files** (see below)
2. **Add rate limiting** to API routes
3. **Add comprehensive validation** for all keys
4. **Document key rotation** process

---

## 📝 Example .env Files

### Main Project `.env.example`:
```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
USE_GEMINI=true
GEMINI_MODEL=gemini-pro

# Hunter.io
HUNTER_API_KEY=your_hunter_api_key_here

# Gmail API
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_FROM_EMAIL=your-email@gmail.com
SEND_EMAILS=false

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Website `.env.example`:
```env
# Apollo.io
APOLLO_API_KEY=your_apollo_api_key_here

# Hunter.io (optional fallback)
HUNTER_API_KEY=your_hunter_api_key_here
```

---

## 🎯 Security Best Practices

1. **Never commit `.env` files** ✅ (Already done)
2. **Use different keys for dev/prod** ⚠️ (Document this)
3. **Rotate keys regularly** ⚠️ (Add schedule)
4. **Monitor API usage** ⚠️ (Set up alerts)
5. **Use least privilege** ✅ (Only required scopes)
6. **Validate all inputs** ⚠️ (Add validation)
7. **Rate limit APIs** ❌ (Implement)
8. **Log security events** ⚠️ (Add logging)

---

**Last Updated:** December 2024



