-- ============================================================
-- Sprint 9b — ogc_accreditations unique index fix
-- Paste into Supabase Dashboard → SQL Editor → Run.
-- Depends on: 20260423_sprint9.sql
--
-- The Sprint 9 migration created two PARTIAL unique indexes on
-- ogc_accreditations so rows with and without accreditation_number could
-- both be deduplicated naturally. Postgres accepted that, but PostgREST's
-- upsert API (`onConflict: 'accreditation_number,role'`) can't target a
-- partial unique index — it requires the exact WHERE predicate in the ON
-- CONFLICT clause, which supabase-js doesn't expose.
--
-- In practice the VA OGC roster returns a Registration Num for every row
-- (100% coverage on both attorneys and claims agents), so the "without
-- number" branch was never going to fire anyway. Replacing the pair of
-- partials with one non-partial unique on (accreditation_number, role)
-- fixes the upsert path and simplifies the sync logic.
--
-- Safe to run: ogc_accreditations is empty (all prior sync attempts failed
-- before inserting anything).
-- ============================================================

drop index if exists public.ogc_accreditations_number_role_uk;
drop index if exists public.ogc_accreditations_name_state_role_uk;

create unique index if not exists ogc_accreditations_number_role_uk
  on public.ogc_accreditations (accreditation_number, role);

comment on index public.ogc_accreditations_number_role_uk is
  'Sprint 9b: full (non-partial) unique on (accreditation_number, role) so PostgREST upserts can target it via onConflict.';
