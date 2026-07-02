# HANDOFF — where we left off

_Last updated: 2026-07-02. Read `CLAUDE.md` first for architecture + conventions._

## Status right now
- **Live in prod:** https://referr-ai-ai-job-engine-automated-r.vercel.app (Vercel, Next 16.0.10). `main` has Phases 1–4 + verified-profile v0.
- **PR #12 OPEN, awaiting the user's merge on GitHub:** "low-friction verification (passive portfolio + 60-sec boost)" — branch `feat/low-friction-verify` (5 files). Build was green.
- This handoff commit (`CLAUDE.md` + `HANDOFF.md`) is added to that same branch → part of PR #12.
- Local prod server may be running on :3210. **Stop it before any rebuild.**

## The immediate next step (do this after PR #12 merges)
Build the **"Request referral" loop** on a new branch off updated `main`:
1. **DB layer** `lib/db/referrals.ts`: create/list `referral_requests` (table exists via migration 0004: `target_company, target_role, jd_text, match_score, brief jsonb, status, contact_id`). Graceful/demo-safe like `lib/db/applications.ts`.
2. **API** `POST /api/referrals`: input = a verified candidate + target company/role/JD → run `verifyCandidate` (brief) + `hunter-client` (match the insider) → persist the row. `PATCH /api/referrals/[id]` for status.
3. **UI:** a "Request referral" button on the verified profile / contact card → shows the underwritten **safe-to-refer brief** and saves it.
4. Then **referrer reputation v1**: a `referrer_reputation` concept (stars/status), ranked by outcomes not count.

## Founder / non-code TODOs (critical path to YC — deadline Jul 27, 2026)
- **Apply migration `0004_verified_profiles.sql`** in Supabase SQL editor (verify persistence needs it).
- **Outreach to AI/ML candidates + startups** this week (traction > features for YC).
- Record the **video demo** (centerpiece = verified profile + safe-to-refer brief).
- Review the 3-week plan in `YC_TIMELINE.md` (local) and open decisions in `YC_STRATEGY.md` (local).

## Open decisions parked (user asked to be reminded)
1. Make the low-friction **AI interview** the flagship verifier?
2. Niche confirmed = **AI/ML & data** (use for demo + outreach).
3. Demo goal: v0 wow now vs. hold for the AI-interview moment.

## Gotchas that bit us (don't repeat)
- Rebuilding while server holds `.next` → white pages. Stop server first.
- Vercel blocks CVE-flagged Next → keep it patched.
- `gh` not installed → PRs via GitHub REST API + `git credential fill`.
- Never push `YC_STRATEGY.md`/`YC_TIMELINE.md` (public repo).
