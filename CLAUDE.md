# CLAUDE.md — ReferrAI engineering guide & state

> Onboarding + guardrails for any AI/dev session. Keep this current. **Repo is PUBLIC** — never put confidential product/funding strategy here.

## Project overview
ReferrAI helps candidates land jobs through **warm referrals**, not the résumé black hole. A user searches a company + role and gets: the right **people** (role-matched employees + recruiters, with email/LinkedIn), real **jobs**, AI-generated **outreach**, a format-locked **LaTeX résumé**, a **pipeline** board, AI **outreach sequences**, and a **verified candidate profile + "safe-to-refer" brief**. Direction: evolve into a **verified-referral network** (AI verifies competence so a stranger can be referred). Product/funding strategy is in **`YC_STRATEGY.md` (LOCAL, gitignored — do NOT commit/push)**.

## Repos in this monorepo
- **`website/`** — the product. **Next.js 16 (App Router), React 19, TS, Tailwind v4.** THIS is what we build. Vercel root dir = `website`.
- `src/` — legacy Node CLI pipeline (tsx). Not the focus.
- `extension/` — Chrome MV3 job-capture extension (calls the website API).
- `YC_STRATEGY.md`, `YC_TIMELINE.md` — local strategy/plan (gitignored).

## Run / build (macOS; the dev machine is SLOW — see gotchas)
```bash
cd website
npm run dev                 # dev (Turbopack cold-compile is SLOW: minutes)
npm run build && npx next start -p 3210   # production (fast at runtime; preferred for testing)
npx tsc --noEmit            # typecheck (uses tsconfig.tsbuildinfo cache; slow if deleted)
```
Local prod URL: http://localhost:3210 · Live: https://referr-ai-ai-job-engine-automated-r.vercel.app

## Architecture (key paths, all under `website/`)
- **Auth/tenancy:** `proxy.ts` (Next 16 middleware → Supabase session refresh), `lib/supabase/{client,server,config,middleware}.ts`, `lib/auth.ts` (`getAppUser`; demo user when Supabase unset).
- **Routes:** `app/(app)/*` protected (dashboard, pipeline, outreach, documents, settings, billing); `app/(auth)/*` (login, register, forgot-password, reset-password); `app/(marketing)/pricing`; `app/verify` (verified profile); `app/api/*`.
- **Data layer:** `lib/db/{applications,sequences,documents,emails,persist,profiles}.ts`; migrations `supabase/migrations/0001..0004`.
- **Contacts/jobs:** `lib/hunter-client.ts` (people, company+department resolve), `lib/company/resolve.ts` (Clearbit name→domain, misspelling-tolerant), `lib/jobs/boards.ts` (Greenhouse/Lever/Ashby real jobs), `lib/job-search-client.ts` (boards→Adzuna→demo), `lib/roles.ts` (role-family matching).
- **AI:** `lib/gemini-client.ts` (model `gemini-3.5-flash`), `lib/resume/{schema,latex,compile,tailor}.ts` (JSON→fixed LaTeX→PDF; local pdflatex or YtoTech remote), `lib/email/gmail.ts` (send + reply detection).
- **Verify engine (Phase 4):** `lib/verify/{schema,github,web,assess}.ts` + `app/api/verify` + `components/verify/VerifyClient.tsx`.
- **Billing/limits:** `lib/billing/{plans,stripe}.ts`, `lib/usage.ts`.
- **Graceful mocks:** `lib/mock/index.ts` — every integration returns realistic demo data when its key is missing, so the whole app runs with zero keys.

## Integrations (live)
Supabase (auth/DB/storage) · Gmail OAuth (send + readonly, env creds) · Hunter (contacts) · Adzuna + Greenhouse/Lever/Ashby (jobs) · Clearbit autocomplete (company resolve) · Gemini 3.5-flash · GitHub public API (verify evidence) · YtoTech (remote LaTeX→PDF) · Stripe (scaffolded, no keys). Keys live in `website/.env.local` (gitignored).

## DONE
- **Phase 1** — SaaS foundation: Supabase auth + multi-tenant Postgres (RLS) + storage; Stripe scaffold + usage limits; graceful mock layer.
- **Phase 2** — format-locked **LaTeX résumé engine** (AI emits JSON → fixed template → PDF via local pdflatex or YtoTech remote fallback).
- **Phase 3** — **pipeline/CRM board**; **outreach sequences** (AI 3-step, cron send + reply auto-stop); **Chrome extension**.
- **Jobs/contacts quality** — company ATS boards (Greenhouse/Lever/Ashby), Clearbit resolution, role-family matching, Hunter department filter.
- **Go-live** — deployed to Vercel; Gmail real send + reply tracking; forgot-password; owner accounts set to unlimited plan.
- **Phase 4 v0** — verified profile (live GitHub evidence) + AI safe-to-refer brief (migration 0004) — MERGED to main.
- **Low-friction verification (PR #12, pending merge)** — passive portfolio reader (`lib/verify/web.ts`) + optional ≤60-sec "one question" boost (`liveAnswer`). Effort is on the AI, not the candidate.

## NEXT (in progress)
**The "Request referral" loop** (Week-1): verified candidate → match to the right insider (reuse `hunter-client`) → generate the underwritten safe-to-refer brief → **persist to `referral_requests`** (seeds the trust graph). Then **referrer reputation v1** (stars/status ranked by outcomes, not count). Niche chosen: **AI/ML & data**.

## Key decisions & constraints
- **Verification is multi-signal, NOT GitHub-only** (excludes non-OSS/new-grads/PMs). Evidence-agnostic, role-adaptive; never penalize a missing source. **No 10–20 min candidate test** — passive by default (~10s to link), optional ≤60s question only.
- **Business model = employer-funded** (success fee per hire), candidates free. (Details in `YC_STRATEGY.md`.)
- **Migrations 0001–0003 applied** in Supabase; **0004 must be applied** before verify persistence works live (founder action in Supabase SQL editor).
- Sequence sending currently DRY-RUN unless Gmail wired; cron endpoints need an external scheduler (`CRON_SECRET`).

## Conventions (do NOT break)
- **Branch + PR flow:** never commit straight to `main`; branch → push → open PR → user merges on GitHub. `gh` CLI is NOT installed — open/merge PRs via the GitHub REST API reusing the stored git credential (`git credential fill`).
- **NEVER commit/push `YC_STRATEGY.md` / `YC_TIMELINE.md` / *.pdf** (gitignored; repo is public).
- **Graceful-degradation is sacred:** anything new must work (mock) when its API key is absent.
- **Client vs server:** keep server-only modules (`lib/db/*`, `lib/supabase/server`) out of client components; put shared types in client-safe files (e.g. `lib/pipeline/constants.ts`, `lib/outreach/constants.ts`).
- **Verify with `tsc` + `next build`** before declaring done; smoke-test routes render real HTML.

## Ops gotchas (this dev machine)
- **Stop the server BEFORE `rm -rf .next && npm run build`** — rebuilding while `next start` holds `.next` corrupts the build (empty/white pages, missing `pages-manifest.json`).
- Slow disk: `git` can hit `index.lock` timeouts; `tsc` is slow without its `tsconfig.tsbuildinfo` cache. If the toolchain wedges, a machine restart clears it.
- **Vercel blocks deploys of CVE-flagged deps** — keep Next patched (currently `16.0.10`).
- `next.config.ts` sets `outputFileTracingRoot` (two lockfiles: root + website).

## Compact instructions (always preserve across sessions)
When compacting/handing off, keep: (1) this file + `HANDOFF.md` accurate; (2) the local-only status of `YC_STRATEGY.md`/`YC_TIMELINE.md`; (3) the branch/PR flow + API-merge method; (4) the "no 20-min verification test" constraint; (5) migration 0004 pending; (6) the memory files under `.claude/.../memory/` (product plan, live integrations, YC strategy). The AI memory index is the source of truth for cross-session context.
