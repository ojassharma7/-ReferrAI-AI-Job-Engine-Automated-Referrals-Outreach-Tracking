-- ReferrAI — Phase 3b: outreach sequences
-- Multi-step follow-ups that auto-stop on reply. Safe to re-run.

-- ============================================================
-- sequences (one per contact/job outreach thread)
-- ============================================================
create table if not exists public.sequences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  contact_id    uuid references public.contacts(id) on delete set null,
  job_id        uuid references public.jobs(id) on delete set null,
  -- denormalized for display even when the contact/job rows aren't persisted
  contact_email text,
  contact_name  text,
  company       text,
  job_title     text,
  status        text not null default 'active'
                  check (status in ('active','replied','completed','stopped')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_sequences_user on public.sequences(user_id);

drop trigger if exists trg_sequences_updated_at on public.sequences;
create trigger trg_sequences_updated_at
  before update on public.sequences
  for each row execute function public.set_updated_at();

-- ============================================================
-- sequence_steps (initial + scheduled follow-ups)
-- ============================================================
create table if not exists public.sequence_steps (
  id              uuid primary key default gen_random_uuid(),
  sequence_id     uuid not null references public.sequences(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  step_no         int  not null,
  send_after_days int  not null default 0,
  subject         text,
  body            text,
  status          text not null default 'pending'
                    check (status in ('pending','sent','skipped')),
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  email_id        uuid references public.emails(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_sequence_steps_user on public.sequence_steps(user_id);
create index if not exists idx_sequence_steps_seq on public.sequence_steps(sequence_id);
-- drives the cron "find due steps" query
create index if not exists idx_sequence_steps_due
  on public.sequence_steps(status, scheduled_for);

-- ============================================================
-- Row Level Security (each user sees only their own rows)
-- ============================================================
do $$
declare
  t text;
  tables text[] := array['sequences','sequence_steps'];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_select', t);
    execute format('drop policy if exists %I on public.%I;', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I;', t || '_update', t);
    execute format('drop policy if exists %I on public.%I;', t || '_delete', t);
    execute format('create policy %I on public.%I for select using (user_id = auth.uid());', t || '_select', t);
    execute format('create policy %I on public.%I for insert with check (user_id = auth.uid());', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (user_id = auth.uid());', t || '_delete', t);
  end loop;
end;
$$;
