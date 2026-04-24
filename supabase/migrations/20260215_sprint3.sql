-- ============================================================
-- Sprint 3 — Auth Schema: profiles + subscriptions
-- Paste into Supabase Dashboard → SQL Editor → Run.
-- Depends on: 20260201_sprint2.sql
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  branch        text,   -- Army, Navy, Air Force, Marine Corps, Coast Guard, Space Force
  rank          text,   -- E-5, O-3, etc.
  mos           text,   -- MOS / Rate / AFSC
  ets_date      date,   -- separation date
  avatar_url    text,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── subscriptions ─────────────────────────────────────────
do $$ begin
  create type subscription_tier as enum ('free', 'pro', 'elite');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
exception when duplicate_object then null;
end $$;

create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  tier                  subscription_tier not null default 'free',
  status                subscription_status,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role manages subscriptions (via webhook)
create policy "Service role manages subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

-- Auto-create free subscription on new user
create or replace function public.handle_new_subscription()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, tier)
  values (new.id, 'free')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_subscription();
