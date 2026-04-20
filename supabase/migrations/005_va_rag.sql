-- Enable pgvector (run once per project — safe to re-run)
create extension if not exists vector with schema extensions;

-- VA knowledge base — stores chunked, embedded domain content for RAG
create table if not exists va_knowledge (
  id          bigserial primary key,
  source      text        not null unique,  -- stable ID, e.g. "va-comp-rates-2025-no-deps"
  category    text        not null,         -- compensation | claims | healthcare | education | housing | career
  content     text        not null,         -- plain-English chunk sent to Claude as context
  embedding   vector(1024),                 -- Voyage AI voyage-3 dimensions
  updated_at  timestamptz not null default now()
);

create index if not exists va_knowledge_embedding_idx
  on va_knowledge
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists va_knowledge_category_idx on va_knowledge (category);

-- RLS: service role writes, authenticated users read
alter table va_knowledge enable row level security;

create policy "service_role_all"
  on va_knowledge for all
  using     (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "authenticated_read"
  on va_knowledge for select
  using (auth.role() = 'authenticated');

-- Vector similarity search — called from the RAG query helper
create or replace function search_va_knowledge(
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
    vk.id,
    vk.content,
    vk.source,
    vk.category,
    1 - (vk.embedding <=> query_embedding) as similarity
  from va_knowledge vk
  where filter_category is null
     or vk.category = filter_category
  order by vk.embedding <=> query_embedding
  limit match_count;
end;
$$;
