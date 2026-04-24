-- ============================================================
-- Pre-Sprint 9 — RAG schema bridge (va_knowledge → knowledge_chunks)
-- Paste into Supabase Dashboard → SQL Editor → Run.
-- Depends on: 20260410_sprint7_rag.sql
--
-- Reconciles the existing Sprint 7 RAG table (`va_knowledge`) with the
-- `knowledge_chunks` schema that Sprints 10-13 assume already exists.
-- Effects:
--   1. Renames table va_knowledge → knowledge_chunks
--   2. Drops the UNIQUE constraint + NOT NULL on `source` (Sprint 10+
--      inserts don't set this column; BVA/CFR/M21-1 chunks use
--      source_type + source_url instead).
--   3. Drops NOT NULL on `category` (Sprint 10+ uses body_system).
--   4. Adds `metadata jsonb NOT NULL DEFAULT '{}'::jsonb` — Sprint 10
--      extends this with cfr_title/cfr_part; Sprint 12 BVA and Sprint
--      13 state benefits both use metadata for cross-refs.
--   5. Renames indexes to the knowledge_chunks_* convention.
--   6. Replaces the `search_va_knowledge` RPC with `search_knowledge_chunks`
--      (same signature; caller updated in src/lib/rag.ts).
-- ============================================================

-- 1. Rename the table.
alter table if exists public.va_knowledge rename to knowledge_chunks;

-- 2. Relax source: drop the unique constraint and NOT NULL.
alter table public.knowledge_chunks
  drop constraint if exists va_knowledge_source_key;

alter table public.knowledge_chunks
  alter column source drop not null;

-- 3. Relax category (Sprint 10+ writes use body_system instead).
alter table public.knowledge_chunks
  alter column category drop not null;

-- 4. Add metadata jsonb (Sprint 10+ writes always set this).
alter table public.knowledge_chunks
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- 5. Rename indexes.
alter index if exists public.va_knowledge_embedding_idx
  rename to knowledge_chunks_embedding_idx;

alter index if exists public.va_knowledge_category_idx
  rename to knowledge_chunks_category_idx;

-- 6. Replace the RPC.
drop function if exists public.search_va_knowledge(vector, int, text);

create or replace function public.search_knowledge_chunks(
  query_embedding vector(1024),
  match_count     int     default 5,
  filter_category text    default null
)
returns table (
  id         bigint,
  content    text,
  source     text,
  category   text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kc.id,
    kc.content,
    kc.source,
    kc.category,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  where filter_category is null
     or kc.category = filter_category
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;
