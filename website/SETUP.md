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

## 5. Gmail sending (outreach emails + sequence follow-ups)

Powers the **Send Email** button and real sending for **outreach sequences**.
One Gmail account via env (per-user Gmail OAuth is a future multi-tenant step).

1. Google Cloud Console → **enable the Gmail API**.
2. **OAuth consent screen**: External; add your own Google account as a *test user*.
   Add scopes `https://www.googleapis.com/auth/gmail.send` **and**
   `https://www.googleapis.com/auth/gmail.readonly` (readonly is needed for reply
   detection in §6).
3. **Credentials → OAuth client ID** (type *Desktop app*). Note the client id/secret.
4. Mint a refresh token with those scopes — easiest via the
   [OAuth Playground](https://developers.google.com/oauthplayground): gear icon →
   *Use your own OAuth credentials* → paste client id/secret → authorize the two
   Gmail scopes → exchange for tokens → copy the **refresh token**.
5. In `website/.env.local`:
   ```
   GMAIL_CLIENT_ID=...
   GMAIL_CLIENT_SECRET=...
   GMAIL_REFRESH_TOKEN=...
   GMAIL_FROM_EMAIL=you@gmail.com
   ```

Without these, sending degrades to a **dry-run** (sequence steps are marked sent
and logged, but no real email goes out), so the flow stays demo-able.

## 6. Outreach automation (send follow-ups + detect replies)

Sequences are driven by two cron endpoints — point any scheduler at them:

| Endpoint | Does |
| --- | --- |
| `POST /api/sequences/cron` | Sends every step whose `scheduled_for` is due (threaded follow-ups). |
| `POST /api/sequences/check-replies` | Polls each active thread; a reply flips the sequence to **replied** and skips remaining steps. |

- **Auth:** set `CRON_SECRET`, then send it as an `x-cron-secret` header (or
  `Authorization: Bearer <secret>`). If `CRON_SECRET` is unset the endpoints are open (dev only).
- **Requirements:** Supabase **service-role key** (§1) for both; Gmail (§5) for real
  sends/reply-reads — otherwise `cron` dry-runs and `check-replies` no-ops.
- **Migrations:** also run [`0002_sequences.sql`](supabase/migrations/0002_sequences.sql)
  and [`0003_sequence_threads.sql`](supabase/migrations/0003_sequence_threads.sql).

Scheduler options: **Vercel Cron** (`vercel.json` hitting the GET form), GitHub
Actions / cron-job.org (with the header), or the legacy **n8n** workflows. A few
times a day is plenty.
