# ReferrAI Website — Setup

The app runs with **zero configuration** in demo mode (no login, demo data, no
limits). Wire up the services below to turn on real accounts, persistence,
billing, and live data. Each one is independent — add them in any order.

```bash
cd website
cp .env.example .env.local   # then fill in values as you go
npm install
npm run dev                  # http://localhost:3000
```

---

## 1. Supabase — accounts, database, storage (enables real multi-user mode)

1. Create a free project at https://supabase.com.
2. **Project Settings → API**: copy into `website/.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by the Stripe webhook)
3. Run the schema migration: open **SQL Editor**, paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it.
   (Or use the Supabase CLI: `supabase db push`.)
   This creates all tables with row-level security, the auto-profile trigger, and
   the private `documents` storage bucket.
4. Restart `npm run dev`. The login/register pages now work and the "Demo mode"
   badge disappears once you sign in.

> Without Supabase the app stays in demo mode: no login is required and nothing
> is persisted.

## 2. Google OAuth (optional — "Continue with Google")

1. In Supabase: **Authentication → Providers → Google**, enable it.
2. Create OAuth credentials at https://console.cloud.google.com/ (APIs &
   Services → Credentials → OAuth client ID, type *Web application*).
3. Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`.
4. Paste the client id/secret into the Supabase Google provider settings.

Email/password sign-up works without this step.

## 3. Contact discovery & job search (live data instead of demo)

Add any of these to `.env.local`; each independently flips that feature from
demo to live:

| Key | Enables | Get it |
| --- | --- | --- |
| `APOLLO_API_KEY` | Recruiter/employee discovery | https://www.apollo.io |
| `HUNTER_API_KEY` | Contact fallback/verification | https://hunter.io |
| `JSEARCH_API_KEY` | Live job postings | RapidAPI → JSearch |
| `GEMINI_API_KEY` | AI resume/cover letter/email | https://aistudio.google.com/app/apikey |

`GEMINI_MODEL` defaults to `gemini-2.0-flash` (the old `gemini-pro` id is
deprecated).

## 4. Stripe — billing & plan limits (test mode is fine)

1. Get test keys at https://dashboard.stripe.com/test/apikeys → set
   `STRIPE_SECRET_KEY`.
2. Create two recurring **Products/Prices** (Pro $29/mo, Enterprise $99/mo) and
   put their price ids in `NEXT_PUBLIC_STRIPE_PRICE_PRO` /
   `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE`.
3. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` (used for checkout redirects).

Upgrades from the **Billing** page now run real Stripe Checkout (test cards),
and the webhook syncs the user's plan + raises their usage limits.

> Until Supabase + Stripe are both configured, usage limits are **not enforced**
> (demo mode), so you can try everything freely.

## 5. Gmail sending (optional — outreach)

Set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` to send via
Gmail. (Phase 4 will move this to per-user Gmail OAuth for deliverability.)
