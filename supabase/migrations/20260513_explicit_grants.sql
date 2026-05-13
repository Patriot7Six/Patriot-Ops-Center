-- ============================================================
-- 2026-05-13 — Explicit Data API grants + lock down future defaults
-- Paste into Supabase Dashboard → SQL Editor → Run.
--
-- Why this migration exists:
--   Supabase is removing the implicit default-privilege grants that have
--   historically exposed every public-schema table to the Data API
--   (PostgREST + GraphQL + supabase-js).
--     * 2026-05-30: new behavior becomes the default for new projects
--     * 2026-10-30: the new behavior is enforced on ALL existing projects
--   See: https://github.com/orgs/supabase/discussions/45329
--
--   Without explicit GRANT statements, the 10 tables this app relies on
--   would become invisible to supabase-js after the cutover.
--
-- What this migration does:
--   1. Grants table privileges that mirror the existing RLS policies
--      (RLS still does row-level enforcement — these grants only decide
--       whether a role can attempt to access the table at all).
--   2. Grants execute on the search_knowledge_chunks RPC.
--   3. Grants usage/select on existing sequences.
--   4. Revokes the default privileges so future tables, sequences, and
--      functions created in public REQUIRE an explicit grant — matches
--      the post-2026-10-30 platform default and prevents accidental
--      Data API exposure of new tables.
--
-- Anon vs. authenticated decisions (from a policy + call-site audit):
--   - benefits, ogc_accreditations: public-read policies + queried from
--     unauthenticated app code → anon SELECT.
--   - All other tables: only signed-in users or service_role touch them
--     → authenticated only, no anon grant.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Public-read tables (anon SELECT)
-- ------------------------------------------------------------

grant select on public.benefits           to anon, authenticated;
grant select on public.ogc_accreditations to anon, authenticated;

-- ------------------------------------------------------------
-- 2. Authenticated-only tables
--    RLS policies on each table restrict which rows a signed-in
--    user can actually read/modify; these grants just open the door.
-- ------------------------------------------------------------

grant select, insert, update, delete on public.profiles         to authenticated;
grant select, insert, update, delete on public.subscriptions    to authenticated;
grant select, insert, update, delete on public.documents        to authenticated;
grant select, insert, update, delete on public.usage_counters   to authenticated;
grant select, insert, update, delete on public.knowledge_chunks to authenticated;
grant select, insert, update, delete on public.agents           to authenticated;
grant select, insert, update, delete on public.referral_cases   to authenticated;
grant select, insert, update, delete on public.case_events      to authenticated;

-- ------------------------------------------------------------
-- 3. service_role — full CRUD on every public table
--    service_role bypasses RLS; used by API routes, webhooks,
--    and state-machine transitions on the server.
-- ------------------------------------------------------------

grant select, insert, update, delete on public.benefits            to service_role;
grant select, insert, update, delete on public.profiles            to service_role;
grant select, insert, update, delete on public.subscriptions       to service_role;
grant select, insert, update, delete on public.documents           to service_role;
grant select, insert, update, delete on public.usage_counters      to service_role;
grant select, insert, update, delete on public.knowledge_chunks    to service_role;
grant select, insert, update, delete on public.agents              to service_role;
grant select, insert, update, delete on public.ogc_accreditations  to service_role;
grant select, insert, update, delete on public.referral_cases      to service_role;
grant select, insert, update, delete on public.case_events         to service_role;

-- ------------------------------------------------------------
-- 4. RPC functions exposed via the Data API
-- ------------------------------------------------------------

grant execute on function public.search_knowledge_chunks(vector, int, text)
  to authenticated, service_role;

-- ------------------------------------------------------------
-- 5. Sequences — anything with a serial/bigserial PK needs USAGE
--    so INSERT can advance the sequence. Safe to run even if all
--    PKs are uuid; it's a no-op for tables without sequences.
-- ------------------------------------------------------------

grant usage, select on all sequences in schema public to authenticated, service_role;

-- ------------------------------------------------------------
-- 6. Future-proofing — match the post-2026-10-30 platform default
--    by revoking the implicit default privileges. After this point,
--    any new table/sequence/function created in public by the
--    postgres role will NOT be reachable via the Data API until
--    an explicit GRANT is added in the same migration.
-- ------------------------------------------------------------

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
