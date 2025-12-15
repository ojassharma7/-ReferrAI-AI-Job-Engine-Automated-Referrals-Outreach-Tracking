# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Apollo.io API Key (FREE)

1. Go to [https://www.apollo.io/](https://www.apollo.io/)
2. Click "Sign Up" (FREE tier - no credit card needed!)
3. After signup, go to **Settings** → **Integrations** → **API Keys**
4. Click **"Create New API Key"**
5. Copy your API key

### Step 2: Set Up Environment

```bash
# In the referrai-website directory
cp .env.local .env

# Edit .env and add your API key
# APOLLO_API_KEY=your_actual_api_key_here
```

### Step 3: Run the App

```bash
npm run dev
```

### Step 4: Test It!

1. Open [http://localhost:3000](http://localhost:3000)
2. Enter:
   - Company: "Google"
   - Role: "Data Scientist"
3. Click "Search"
4. See results! 🎉

---

## ✅ What You'll See

- **Company Info**: Company name, domain, industry
- **Recruiters Tab**: Hiring managers, technical recruiters, talent acquisition
- **Domain Employees Tab**: People working in your selected role
- **Contact Cards**: Name, email, title, LinkedIn, verification status

---

## 🎯 Next Steps

1. **Test with different companies**: Try "Microsoft", "Amazon", etc.
2. **Test different roles**: "Software Engineer", "Product Manager", etc.
3. **Check the results**: Verify contacts are relevant
4. **Review the code**: Understand how it works

---

## 🐛 Troubleshooting

### Error: "APOLLO_API_KEY is not set"
- Make sure you created `.env` file
- Check that `APOLLO_API_KEY=your_key` is in the file
- Restart the dev server: `npm run dev`

### Error: "Apollo.io API error"
- Check your API key is correct
- Verify you're on the FREE tier (10,000 credits/month)
- Check Apollo.io dashboard for API usage

### No results found
- Try a different company name
- Try a different role
- Some companies may have limited data

---

## 📊 Apollo.io FREE Tier Limits

- **10,000 email credits/month**
- Each search = ~1 credit
- Can search 10,000 times/month
- Perfect for MVP and testing!

---

## 🎉 You're Ready!

The frontend is set up and ready to use. Just add your Apollo.io API key and start searching!

Next: We'll add job search, resume generation, and email features.

