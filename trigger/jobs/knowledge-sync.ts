// trigger/jobs/knowledge-sync.ts
// Syncs VA_KNOWLEDGE_CHUNKS into the va_knowledge Supabase table on a weekly
// schedule. Each chunk is embedded via Voyage AI and upserted by stable source ID.
// Re-run manually after editing va-data.ts to push updates immediately.
import { task, schedules } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import { VA_KNOWLEDGE_CHUNKS } from '../../src/lib/va-data'
import { generateEmbeddings } from '../../src/lib/embeddings'

const BATCH_SIZE = 20 // Voyage AI max is 128; keep smaller to stay within rate limits

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ── Manual / triggered run ────────────────────────────────────────────────────
export const syncVAKnowledgeJob = task({
  id: 'sync-va-knowledge',
  machine: { preset: 'small-1x' },
  run: async () => {
    return await runSync()
  },
})

// ── Scheduled: every Monday at 2am UTC ───────────────────────────────────────
export const syncVAKnowledgeScheduled = schedules.task({
  id: 'sync-va-knowledge-scheduled',
  cron: '0 2 * * 1',
  machine: { preset: 'small-1x' },
  run: async () => {
    return await runSync()
  },
})

// ── Core sync logic ───────────────────────────────────────────────────────────
async function runSync() {
  const supabase = getServiceClient()
  const chunks = VA_KNOWLEDGE_CHUNKS
  let upserted = 0
  let failed = 0

  console.log(`[knowledge-sync] Starting sync of ${chunks.length} chunks`)

  // Process in batches to stay within Voyage AI rate limits
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const texts = batch.map(c => c.content)

    let embeddings: number[][]
    try {
      embeddings = await generateEmbeddings(texts)
    } catch (err) {
      console.error(`[knowledge-sync] Embedding batch ${i}-${i + BATCH_SIZE} failed:`, err)
      failed += batch.length
      continue
    }

    const rows = batch.map((chunk, idx) => ({
      source:    chunk.source,
      category:  chunk.category,
      content:   chunk.content,
      embedding: JSON.stringify(embeddings[idx]), // pgvector accepts JSON array string
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('va_knowledge')
      .upsert(rows, { onConflict: 'source' })

    if (error) {
      console.error(`[knowledge-sync] Upsert batch ${i}-${i + BATCH_SIZE} failed:`, error)
      failed += batch.length
    } else {
      upserted += batch.length
    }
  }

  // Remove stale rows that no longer exist in VA_KNOWLEDGE_CHUNKS
  const activeSources = chunks.map(c => c.source)
  const { error: deleteError } = await supabase
    .from('va_knowledge')
    .delete()
    .not('source', 'in', `(${activeSources.map(s => `"${s}"`).join(',')})`)

  if (deleteError) {
    console.warn('[knowledge-sync] Stale row cleanup failed:', deleteError)
  }

  console.log(`[knowledge-sync] Done — upserted: ${upserted}, failed: ${failed}`)
  return { upserted, failed, total: chunks.length }
}
