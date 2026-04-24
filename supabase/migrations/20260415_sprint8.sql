-- ============================================================
-- Sprint 8 — Tier simplification completion (subscriptions.billing_interval)
-- Paste into Supabase Dashboard → SQL Editor → Run.
-- Depends on: 20260410_sprint7_rag.sql
--
-- Sprint 8 collapsed SubscriptionTier from {free, pro, elite} to {free, elite}
-- and introduced an explicit monthly/yearly axis via a new billing_interval
-- column. The tier collapse was applied to production data; this migration
-- adds the billing_interval column that Sprint 9's types expect.
--
-- If your existing subscriptions rows have a natural monthly/yearly value
-- you can derive (e.g. from Stripe's current_period_end - current_period_start),
-- backfill them after this migration. Leaving them NULL is safe — app code
-- treats NULL as "unknown" and falls back to monthly display.
-- ============================================================

alter table public.subscriptions
  add column if not exists billing_interval text
    check (billing_interval in ('monthly', 'yearly'));

comment on column public.subscriptions.billing_interval is
  'Sprint 8: monthly | yearly. NULL = legacy row or unknown cadence.';
