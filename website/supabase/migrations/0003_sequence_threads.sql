-- ReferrAI — go-live: thread the Gmail conversation per sequence so follow-ups
-- land in the same thread and reply-detection can poll it. Safe to re-run.
alter table public.sequences add column if not exists thread_id text;
