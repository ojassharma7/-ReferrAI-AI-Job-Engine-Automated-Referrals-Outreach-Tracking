-- ReferrAI — Phase 4: verified-referral engine
-- A candidate's evidence-backed competence profile + per-role "safe to refer"
-- referral requests. This is the differentiator (the trust graph seed).

create table if not exists public.verified_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  github_username   text,
  portfolio_url     text,
  linkedin_url      text,
  highlights        text,
  competence_score  int,
  assessment        jsonb,              -- VerifiedAssessment (summary/strengths/gaps/evidence)
  verified_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_verified_profiles_updated_at on public.verified_profiles;
create trigger trg_verified_profiles_updated_at
  before update on public.verified_profiles
  for each row execute function public.set_updated_at();

create table if not exists public.referral_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  contact_id      uuid references public.contacts(id) on delete set null,
  target_company  text,
  target_role     text,
  jd_text         text,
  match_score     int,
  brief           jsonb,               -- SafeToReferBrief shown to the referrer
  status          text not null default 'draft'
                    check (status in ('draft','requested','accepted','declined','referred','hired')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_referral_requests_user on public.referral_requests(user_id);

drop trigger if exists trg_referral_requests_updated_at on public.referral_requests;
create trigger trg_referral_requests_updated_at
  before update on public.referral_requests
  for each row execute function public.set_updated_at();

-- Row Level Security: each user sees only their own rows.
do $$
declare
  t text;
  tables text[] := array['verified_profiles','referral_requests'];
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
