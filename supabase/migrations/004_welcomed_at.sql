-- ============================================================
-- Sprint 7 — Idempotency column for the welcome-email Trigger job
-- Run AFTER 003_documents.sql
-- ============================================================
-- `welcomed_at` is set by the auth callback after firing the
-- send-welcome-email + onboarding-nudge Trigger.dev jobs, so
-- the jobs fire exactly once per account regardless of how
-- many times the user logs in.

alter table public.profiles
  add column if not exists welcomed_at timestamptz;
