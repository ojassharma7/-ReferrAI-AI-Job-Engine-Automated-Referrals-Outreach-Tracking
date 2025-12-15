# JSearch API Setup Guide

JSearch API provides job search functionality for the ReferrAI website.

## Quick Setup

### Step 1: Get API Key from RapidAPI

1. Go to [RapidAPI JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Sign up for a free account (or log in)
3. Subscribe to the **Basic** plan (FREE tier available)
4. Copy your API key from the dashboard

### Step 2: Add to Environment

Add to `website/.env.local`:

```env
JSEARCH_API_KEY=your_rapidapi_key_here
```

### Step 3: Restart Dev Server

```bash
cd website
npm run dev
```

## Free Tier Limits

- **Basic (Free):** 250 requests/month
- **Pro:** 2,500 requests/month ($9.99/month)

## How It Works

1. User searches for company + role
2. JSearch API searches job boards (LinkedIn, Indeed, Glassdoor, etc.)
3. Results are filtered to match the company name
4. Jobs are displayed in the "Jobs" tab

## Alternative APIs

If JSearch doesn't work for you, you can:

1. **Adzuna API** - Free tier available
2. **SerpAPI** - Google Jobs scraping (paid)
3. **Indeed API** - Limited access

To switch, modify `website/lib/job-search-client.ts`

## Troubleshooting

**No jobs showing up?**
- Check that `JSEARCH_API_KEY` is set in `.env.local`
- Verify the API key is valid in RapidAPI dashboard
- Check browser console for errors
- Try a different company/role combination

**API errors?**
- Check your RapidAPI subscription status
- Verify you haven't exceeded free tier limits
- Check network tab for API response

