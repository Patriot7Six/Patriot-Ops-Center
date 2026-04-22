// trigger/jobs/knowledge-sync.ts
// Syncs VA knowledge chunks into the va_knowledge Supabase table on a weekly
// schedule. Each chunk is embedded via Voyage AI and upserted by stable source ID.
//
// Before building chunks, the sync attempts a LIVE fetch of VA compensation
// rates from va.gov (va-rate-fetcher). Outcomes:
//   • fetch ok, matches committed  → use committed rates (happy path)
//   • fetch ok, drift detected     → use LIVE rates, log drift so maintainers
//                                    can update src/lib/va-rates.ts
//   • fetch fails, committed fresh → use committed rates, log warning
//   • fetch fails, committed stale → FAIL LOUDLY (throw), refuse to push rates
//                                    older than ~14 months to production
//
// Re-run manually after editing va-data.ts or va-rates.ts to push updates.
import { task, schedules } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import {
  buildKnowledgeChunks,
  type KnowledgeChunk,
} from '../../src/lib/va-data'
import {
  COMPENSATION_RATES,
  SMC_RATES,
  DIC_RATES,
  EDUCATION_RATES,
  LOAN_LIMITS,
  TEXAS_PROPERTY_TAX,
  compensationRatesAgeMonths,
  ratesAreStale,
  type CompensationRates,
} from '../../src/lib/va-rates'
import { fetchLiveCompensationRates, diffRates } from '../../src/lib/va-rate-fetcher'
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

  const comp = await resolveCompensationRates()
  const chunks = buildKnowledgeChunks({
    comp,
    smc:              SMC_RATES,
    dic:              DIC_RATES,
    education:        EDUCATION_RATES,
    loans:            LOAN_LIMITS,
    texasPropertyTax: TEXAS_PROPERTY_TAX,
  })

  console.log(`[knowledge-sync] Starting sync of ${chunks.length} chunks (effective ${comp.effective_date})`)

  let upserted = 0
  let failed = 0

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

    const rows = batch.map((chunk: KnowledgeChunk, idx: number) => ({
      source:     chunk.source,
      category:   chunk.category,
      content:    chunk.content,
      embedding:  JSON.stringify(embeddings[idx]), // pgvector accepts JSON array string
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

  // Remove stale rows that no longer exist in the active chunk set
  const activeSources = chunks.map(c => c.source)
  const { error: deleteError } = await supabase
    .from('va_knowledge')
    .delete()
    .not('source', 'in', `(${activeSources.map(s => `"${s}"`).join(',')})`)

  if (deleteError) {
    console.warn('[knowledge-sync] Stale row cleanup failed:', deleteError)
  }

  console.log(`[knowledge-sync] Done — upserted: ${upserted}, failed: ${failed}, effective: ${comp.effective_date}`)
  return { upserted, failed, total: chunks.length, effective_date: comp.effective_date }
}

// Pick which compensation rates to embed. Prefers live-fetched values from
// va.gov; falls back to committed values in va-rates.ts. Throws if the
// committed values are stale AND live fetch failed — refusing to push
// year-old rates to production is the whole point of this layer.
async function resolveCompensationRates(): Promise<CompensationRates> {
  const live = await fetchLiveCompensationRates()

  if (live.ok) {
    const diffs = diffRates(COMPENSATION_RATES, live.rates)
    if (diffs.length === 0) {
      console.log('[knowledge-sync] Rate check: committed rates match va.gov ✓')
      return COMPENSATION_RATES
    }
    console.warn(
      `[knowledge-sync] ⚠ DRIFT DETECTED between committed rates and va.gov (${diffs.length} diffs):`,
    )
    for (const d of diffs) console.warn(`  • ${d}`)
    console.warn('[knowledge-sync] Using LIVE rates for this sync. Please update src/lib/va-rates.ts to match.')
    return live.rates
  }

  // Live fetch failed. How stale are committed values?
  const ageMonths = compensationRatesAgeMonths()
  console.warn(
    `[knowledge-sync] Live rate fetch failed (${live.error}). Committed rates effective ${COMPENSATION_RATES.effective_date} (${ageMonths} months ago).`,
  )

  if (ratesAreStale()) {
    throw new Error(
      `Refusing to sync: committed VA rates are ${ageMonths} months old and live fetch from va.gov failed (${live.error}). ` +
      `Update src/lib/va-rates.ts with the latest COLA rates from ${COMPENSATION_RATES.source_url} and re-run.`,
    )
  }

  console.warn('[knowledge-sync] Falling back to committed rates.')
  return COMPENSATION_RATES
}
