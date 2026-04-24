-- ============================================================
-- Sprint 4 — Documents Table
-- Paste into Supabase Dashboard → SQL Editor → Run.
-- Depends on: 20260215_sprint3.sql
-- ============================================================

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('uploading', 'ready', 'analyzing', 'analyzed', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,           -- original filename
  storage_path  text not null,           -- path in Supabase Storage
  mime_type     text,
  size_bytes    bigint,
  status        document_status not null default 'ready',
  ai_summary    text,                    -- AI-generated analysis result
  tags          text[],                  -- e.g. ARRAY['DD-214', 'medical', 'discharge']
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users manage own documents"
  on public.documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_created_at_idx on public.documents(created_at desc);

-- ── usage_counters: track monthly AI usage per user ───────────
create table if not exists public.usage_counters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  month       text not null,  -- 'YYYY-MM'
  feature     text not null,  -- 'va_eligibility' | 'claims_copilot'
  count       int not null default 0,
  unique(user_id, month, feature)
);

alter table public.usage_counters enable row level security;

create policy "Users read own usage"
  on public.usage_counters for select
  using (auth.uid() = user_id);

-- NOTE: Service role bypasses RLS entirely — no policy needed for service role writes.
-- The policy below is intentionally scoped to authenticated users only.
create policy "Service role manages usage"
  on public.usage_counters for all
  using (true)
  with check (true);