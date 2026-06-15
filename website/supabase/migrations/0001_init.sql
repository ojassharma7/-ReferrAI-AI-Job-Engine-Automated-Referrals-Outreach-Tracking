-- ReferrAI — Phase 1 foundation schema
-- Multi-tenant: every row is owned by a user (auth.users) and protected by RLS.
-- Safe to re-run during development (uses IF NOT EXISTS / DROP ... IF EXISTS).

-- ============================================================
-- Helper: auto-update updated_at on row change
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles (1:1 with auth.users)
-- ============================================================
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text,
  headline          text,
  candidate_profile text,             -- freeform background used to personalize AI output
  base_resume_text  text,             -- plain-text master resume
  base_resume_latex text,             -- LaTeX master resume (Phase 2 flagship)
  plan              text not null default 'free' check (plan in ('free','pro','enterprise')),
  stripe_customer_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- companies
-- ============================================================
create table if not exists public.companies (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  domain       text,
  industry     text,
  size         text,
  location     text,
  website      text,
  linkedin_url text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_companies_user on public.companies(user_id);
-- One company per (user, domain) so searches can upsert.
create unique index if not exists uq_companies_user_domain
  on public.companies(user_id, lower(domain)) where domain is not null and domain <> '';

-- ============================================================
-- contacts
-- ============================================================
create table if not exists public.contacts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  company_id      uuid references public.companies(id) on delete set null,
  email           text,
  full_name       text,
  first_name      text,
  last_name       text,
  title           text,
  department      text,
  seniority       text check (seniority in ('IC','Lead','Manager','Director','VP','C-level')),
  linkedin_url    text,
  phone           text,
  email_verified  boolean not null default false,
  email_status    text check (email_status in ('verified','likely','guessed','invalid','unknown')),
  relevance_score int  not null default 50,
  source          text check (source in ('apollo','hunter','zoominfo')),
  is_recruiter    boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists idx_contacts_user on public.contacts(user_id);
create index if not exists idx_contacts_company on public.contacts(company_id);
-- Dedup verified contacts per user by email.
create unique index if not exists uq_contacts_user_email
  on public.contacts(user_id, lower(email)) where email is not null and email <> '';

-- ============================================================
-- jobs
-- ============================================================
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete set null,
  external_id text,                   -- provider job id (e.g. jsearch) for dedup
  title       text not null,
  location    text,
  job_type    text,
  jd_text     text,
  jd_url      text,
  source      text check (source in ('linkedin','indeed','glassdoor','company','jsearch','manual')),
  posted_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_jobs_user on public.jobs(user_id);
create unique index if not exists uq_jobs_user_external
  on public.jobs(user_id, external_id) where external_id is not null and external_id <> '';

-- ============================================================
-- documents (generated resumes / cover letters)
-- ============================================================
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  job_id       uuid references public.jobs(id) on delete set null,
  type         text not null check (type in ('resume','cover_letter')),
  latex_source text,
  text_content text,
  pdf_path     text,                  -- path within the private 'documents' storage bucket
  created_at   timestamptz not null default now()
);
create index if not exists idx_documents_user on public.documents(user_id);

-- ============================================================
-- applications (the pipeline / CRM rows)
-- ============================================================
create table if not exists public.applications (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  job_id               uuid references public.jobs(id) on delete set null,
  contact_id           uuid references public.contacts(id) on delete set null,
  status               text not null default 'saved'
                         check (status in ('saved','contacted','replied','referred','interview','offer','rejected')),
  resume_doc_id        uuid references public.documents(id) on delete set null,
  cover_letter_doc_id  uuid references public.documents(id) on delete set null,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_applications_user on public.applications(user_id);

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ============================================================
-- emails (outreach)
-- ============================================================
create table if not exists public.emails (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete set null,
  job_id      uuid references public.jobs(id) on delete set null,
  subject     text,
  body        text,
  status      text not null default 'draft' check (status in ('draft','sent','replied','bounced')),
  thread_id   text,
  sent_at     timestamptz,
  replied_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_emails_user on public.emails(user_id);

-- ============================================================
-- email_events (opens / clicks / replies / bounces)
-- ============================================================
create table if not exists public.email_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  email_id    uuid not null references public.emails(id) on delete cascade,
  type        text not null check (type in ('open','click','reply','bounce')),
  occurred_at timestamptz not null default now(),
  meta        jsonb
);
create index if not exists idx_email_events_user on public.email_events(user_id);
create index if not exists idx_email_events_email on public.email_events(email_id);

-- ============================================================
-- usage_log (drives per-plan rate limits)
-- ============================================================
create table if not exists public.usage_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  action      text not null check (action in ('search','generate','send')),
  occurred_at timestamptz not null default now(),
  meta        jsonb
);
create index if not exists idx_usage_user_time on public.usage_log(user_id, occurred_at);

-- ============================================================
-- subscriptions (synced from Stripe webhooks)
-- ============================================================
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   text not null default 'free' check (plan in ('free','pro','enterprise')),
  status                 text,        -- Stripe status: active, trialing, past_due, canceled, ...
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create unique index if not exists uq_subscriptions_user on public.subscriptions(user_id);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security: each user sees only their own rows
-- ============================================================
do $$
declare
  t text;
  tables text[] := array[
    'profiles','companies','contacts','jobs','documents',
    'applications','emails','email_events','usage_log','subscriptions'
  ];
  owner_col text;
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- profiles is keyed by id (== auth.uid()); every other table uses user_id.
    if t = 'profiles' then owner_col := 'id'; else owner_col := 'user_id'; end if;

    execute format('drop policy if exists %I on public.%I;', t || '_select', t);
    execute format('drop policy if exists %I on public.%I;', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I;', t || '_update', t);
    execute format('drop policy if exists %I on public.%I;', t || '_delete', t);

    execute format(
      'create policy %I on public.%I for select using (%I = auth.uid());',
      t || '_select', t, owner_col);
    execute format(
      'create policy %I on public.%I for insert with check (%I = auth.uid());',
      t || '_insert', t, owner_col);
    execute format(
      'create policy %I on public.%I for update using (%I = auth.uid()) with check (%I = auth.uid());',
      t || '_update', t, owner_col, owner_col);
    execute format(
      'create policy %I on public.%I for delete using (%I = auth.uid());',
      t || '_delete', t, owner_col);
  end loop;
end;
$$;

-- ============================================================
-- Storage: private bucket for generated PDFs.
-- Objects are namespaced by user id: <uid>/<doc>.pdf
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_read_own" on storage.objects;
drop policy if exists "documents_insert_own" on storage.objects;
drop policy if exists "documents_update_own" on storage.objects;
drop policy if exists "documents_delete_own" on storage.objects;

create policy "documents_read_own" on storage.objects
  for select using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "documents_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "documents_update_own" on storage.objects
  for update using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "documents_delete_own" on storage.objects
  for delete using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
