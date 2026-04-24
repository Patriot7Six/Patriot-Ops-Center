-- ============================================================
-- Sprint 9 — Agent Referrals v1
-- Schema for the agent referral marketplace:
--   • agents              — agent accounts (linked to auth.users)
--   • ogc_accreditations  — cached OGC roster for accreditation verification
--   • referral_cases      — veteran-submitted cases seeking agent representation
--   • case_events         — append-only audit log of actions on each case
--
-- Run AFTER 20260422_sprint8.sql
-- ============================================================

-- ── Enums ───────────────────────────────────────────────────────────────────

do $$ begin
  create type agent_role as enum ('attorney', 'claims_agent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type agent_status as enum ('pending_verification', 'verified', 'suspended', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type case_status as enum (
    'submitted',          -- veteran just submitted, awaiting review
    'open',               -- passed screening, visible to agents
    'accepted',           -- an agent has taken the case
    'won',                -- agent reports favorable VA decision
    'lost',               -- agent reports unfavorable VA decision
    'withdrawn',          -- veteran withdrew or agent withdrew
    'expired'             -- no agent accepted within the window
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type case_event_type as enum (
    'submitted',
    'screened',
    'accepted',
    'declined',
    'withdrawn',
    'outcome_won',
    'outcome_lost',
    'note',
    'expired'
  );
exception when duplicate_object then null;
end $$;

-- ── agents ──────────────────────────────────────────────────────────────────
-- One row per agent user. Agents are Supabase auth users with `is_agent=true`
-- in profiles (see below) and a linked row here with their accreditation info.

create table if not exists public.agents (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references auth.users(id) on delete cascade,
  role                     agent_role not null,
  status                   agent_status not null default 'pending_verification',

  -- Applicant-declared fields (filled out on `/agent/apply`)
  full_name                text not null,
  firm_name                text,
  bar_number               text,                     -- attorneys only
  bar_state                text,                     -- attorneys only; 2-letter USPS code
  ogc_accreditation_number text,                     -- OGC-issued ID (if they know it)
  practice_states          text[] not null default '{}', -- states they serve, 2-letter codes
  specialties              text[] not null default '{}', -- e.g. 'ptsd','tbi','mst','pact','tdiu','appeals'
  bio                      text,
  phone                    text,
  public_email             text,                     -- distinct from auth email if they want

  -- Verification metadata (set by the sync job or an admin)
  verified_at              timestamptz,
  verification_source      text,                     -- 'ogc_auto' | 'admin_manual' | null
  ogc_last_seen_at         timestamptz,              -- most recent match in ogc_accreditations
  admin_notes              text,

  -- Capacity throttle — how many open cases an agent can hold at once
  max_concurrent_cases     int not null default 10,
  accepting_cases          boolean not null default true,

  -- Stripe for per-case billing (Sprint 10 wires actual charges)
  stripe_customer_id       text unique,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists agents_status_idx           on public.agents (status);
create index if not exists agents_practice_states_idx  on public.agents using gin (practice_states);
create index if not exists agents_specialties_idx      on public.agents using gin (specialties);

alter table public.agents enable row level security;

-- Agents can read/update their own row
create policy "agents_read_own" on public.agents
  for select using (auth.uid() = user_id);

create policy "agents_update_own" on public.agents
  for update using (auth.uid() = user_id);

-- Service role manages verification state (via sync job + admin actions)
create policy "agents_service_all" on public.agents
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── Add is_agent flag to profiles ───────────────────────────────────────────
-- Simpler than a separate role table; a user is either a vet, an agent, or
-- (rarely) both. Default false preserves existing behavior.

alter table public.profiles
  add column if not exists is_agent boolean not null default false;

create index if not exists profiles_is_agent_idx on public.profiles (is_agent) where is_agent = true;

-- ── ogc_accreditations ──────────────────────────────────────────────────────
-- A nightly/tri-weekly cache of the OGC roster. The sync job (trigger/jobs/
-- ogc-sync.ts) downloads the public Excel, parses it, and upserts here.
-- Used at agent-application time to flip `agents.status = 'verified'` if the
-- OGC record exists.

create table if not exists public.ogc_accreditations (
  id              bigserial primary key,

  -- Natural key: the OGC-assigned number is unique per accredited individual.
  -- Some older agents don't have a stable number — in that case we fall back
  -- to name+state, but the sync job prefers accreditation_number when present.
  accreditation_number text,
  role                 agent_role not null,

  first_name      text not null,
  last_name       text not null,
  city            text,
  state           text,         -- 2-letter USPS
  postal_code     text,
  phone           text,
  email           text,
  organization    text,         -- firm, law office, or VSO name

  ingested_at     timestamptz not null default now(),
  source_file     text,         -- URL of the Excel we ingested from

  -- Unique on (accreditation_number, role) when number present; otherwise on
  -- (last_name, first_name, state, role). We express both as partial unique
  -- indexes so the upsert can target either via ON CONFLICT.
  created_at      timestamptz not null default now()
);

create unique index if not exists ogc_accreditations_number_role_uk
  on public.ogc_accreditations (accreditation_number, role)
  where accreditation_number is not null;

create unique index if not exists ogc_accreditations_name_state_role_uk
  on public.ogc_accreditations (lower(last_name), lower(first_name), state, role)
  where accreditation_number is null;

create index if not exists ogc_accreditations_name_idx
  on public.ogc_accreditations (lower(last_name), lower(first_name));

alter table public.ogc_accreditations enable row level security;

-- OGC roster is public information; anyone (including anon) can read.
-- Only service role writes.
create policy "ogc_accred_public_read" on public.ogc_accreditations
  for select using (true);

create policy "ogc_accred_service_write" on public.ogc_accreditations
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── referral_cases ──────────────────────────────────────────────────────────
-- One row per veteran-submitted case seeking agent representation.

create table if not exists public.referral_cases (
  id                uuid primary key default gen_random_uuid(),
  veteran_user_id   uuid not null references auth.users(id) on delete cascade,
  agent_id          uuid references public.agents(id) on delete set null,
  status            case_status not null default 'submitted',

  -- Case details (collected on /referral intake)
  condition_summary text not null,       -- plain-English from veteran
  denial_summary    text,                -- if this is an appeal
  current_rating    int,                 -- 0-100 (nullable for initial claims)
  requested_rating  int,                 -- target rating (nullable)
  state             text not null,       -- 2-letter USPS — drives matching
  specialty_tags    text[] not null default '{}', -- 'ptsd','mst','tbi',...
  urgency           text,                -- 'standard' | 'urgent' (appeals with deadlines)
  denial_letter_path text,               -- storage path if uploaded
  extra_notes       text,

  -- Scoring + economics
  strength_score    int,                 -- 0-100, set by screening AI (Sprint 9b)
  estimated_backpay_cents bigint,        -- rough estimate for agent visibility

  -- Outcome
  outcome_decided_at   timestamptz,
  outcome_backpay_cents bigint,
  outcome_notes     text,

  -- Lifecycle timestamps
  submitted_at      timestamptz not null default now(),
  opened_at         timestamptz,         -- when admin/AI moves status submitted→open
  accepted_at       timestamptz,
  expires_at        timestamptz not null default (now() + interval '14 days'),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists referral_cases_status_idx       on public.referral_cases (status);
create index if not exists referral_cases_state_idx        on public.referral_cases (state);
create index if not exists referral_cases_specialty_idx    on public.referral_cases using gin (specialty_tags);
create index if not exists referral_cases_veteran_idx      on public.referral_cases (veteran_user_id);
create index if not exists referral_cases_agent_idx        on public.referral_cases (agent_id) where agent_id is not null;
create index if not exists referral_cases_open_expires_idx on public.referral_cases (expires_at) where status = 'open';

alter table public.referral_cases enable row level security;

-- Veterans read their own cases
create policy "cases_veteran_read_own" on public.referral_cases
  for select using (auth.uid() = veteran_user_id);

-- Veterans can update their own cases only if still in 'submitted' or 'open'
-- state (mainly to withdraw).
create policy "cases_veteran_update_own" on public.referral_cases
  for update using (
    auth.uid() = veteran_user_id
    and status in ('submitted', 'open')
  );

-- Agents: can SELECT open cases that match at least one of their practice
-- states, OR cases they've been assigned to.
create policy "cases_agent_read_matching" on public.referral_cases
  for select using (
    exists (
      select 1 from public.agents a
      where a.user_id = auth.uid()
        and a.status = 'verified'
        and (
          referral_cases.agent_id = a.id
          or (
            referral_cases.status = 'open'
            and referral_cases.state = any(a.practice_states)
          )
        )
    )
  );

-- Agents update (accept/outcome) is mediated by API routes using service role
-- — no direct update policy here to keep the state machine centralized.

-- Service role manages everything
create policy "cases_service_all" on public.referral_cases
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── case_events ─────────────────────────────────────────────────────────────
-- Append-only audit log. Every state change adds a row. Used for:
--   • case-detail timeline in both veteran and agent dashboards
--   • dispute investigation
--   • billing reconciliation

create table if not exists public.case_events (
  id           bigserial primary key,
  case_id      uuid not null references public.referral_cases(id) on delete cascade,
  event_type   case_event_type not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role   text not null,        -- 'veteran' | 'agent' | 'system' | 'admin'
  payload      jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists case_events_case_id_idx on public.case_events (case_id, created_at desc);

alter table public.case_events enable row level security;

-- Events readable by anyone who can read the parent case (reuses the case RLS)
create policy "case_events_read_via_case" on public.case_events
  for select using (
    exists (
      select 1 from public.referral_cases rc
      where rc.id = case_events.case_id
        and (
          auth.uid() = rc.veteran_user_id
          or exists (
            select 1 from public.agents a
            where a.user_id = auth.uid()
              and a.status = 'verified'
              and (rc.agent_id = a.id or (rc.status = 'open' and rc.state = any(a.practice_states)))
          )
        )
    )
  );

create policy "case_events_service_all" on public.case_events
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── Comments for future maintainers ─────────────────────────────────────────

comment on table public.agents is
  'Sprint 9 (2026-04): agent accounts for the referral marketplace. Linked 1:1 to auth.users.';
comment on table public.ogc_accreditations is
  'Sprint 9: cached copy of OGC public accreditation roster. Refreshed tri-weekly by trigger/jobs/ogc-sync.ts.';
comment on table public.referral_cases is
  'Sprint 9: veteran-submitted cases seeking agent representation. Per-case $250 billed on status=won (Sprint 10).';
comment on table public.case_events is
  'Sprint 9: append-only audit log for referral cases.';
