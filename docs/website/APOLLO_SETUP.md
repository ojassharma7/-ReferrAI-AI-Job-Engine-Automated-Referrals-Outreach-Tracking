# Apollo.io API Setup Guide

## 🎯 Getting Started with Apollo.io FREE Tier

### Step 1: Sign Up for Apollo.io

1. Go to [Apollo.io](https://www.apollo.io/)
2. Click "Sign Up" (FREE tier)
3. Create your account

### Step 2: Get Your API Key

1. Log in to Apollo.io
2. Go to **Settings** → **Integrations** → **API Keys**
3. Click **"Create New API Key"**
4. Copy your API key

### Step 3: Add to Environment Variables

Add to your `.env` file:

```env
APOLLO_API_KEY=your_apollo_api_key_here
```

### Step 4: Test the API

The API is already integrated in the codebase. Just:
1. Set your API key in `.env`
2. Run the app: `npm run dev`
3. Try searching for a company!

---

## 📊 Apollo.io FREE Tier Limits

- **10,000 email credits/month** - FREE!
- Each contact search = ~1 credit
- Can discover 10,000 contacts/month
- Email verification included
- API access included

**Perfect for MVP and testing!**

---

## 🔍 API Endpoints Used

### 1. Search Contacts
- **Endpoint**: `POST /v1/mixed_people/search`
- **Purpose**: Find contacts by company and role
- **Returns**: List of contacts with emails, titles, LinkedIn

### 2. Lookup Company
- **Endpoint**: `POST /v1/organizations/search`
- **Purpose**: Get company information
- **Returns**: Company details (domain, industry, size)

---

## 📝 Example API Call

```typescript
// Search for Data Scientists at Google
const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    api_key: 'your_api_key',
    q_organization_name: 'Google',
    person_titles: ['Data Scientist', 'ML Engineer'],
    per_page: 100,
  }),
});
```

---

## 🚀 Next Steps

1. ✅ Sign up for Apollo.io FREE tier
2. ✅ Get your API key
3. ✅ Add to `.env` file
4. ✅ Test the search functionality
5. ✅ Start building!

---

For detailed API documentation, visit: https://docs.apollo.io/

