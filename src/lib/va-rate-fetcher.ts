// Live-fetches VA disability compensation rates from va.gov and returns them
// in the same shape as COMPENSATION_RATES. Used by the weekly knowledge-sync
// job as a self-healing layer: if committed rates drift from va.gov between
// annual updates, the fetcher catches it and the sync pushes the live values
// to Supabase (committed values remain the review-able fallback).
//
// Design principle: fail safe. Any error, parse miss, or failed sanity check
// returns { ok: false } and the caller uses COMPENSATION_RATES verbatim.
// Never return partially-parsed rates — all three tables must parse cleanly
// and pass monotonic-by-rating sanity checks, or we abort.

import { COMPENSATION_RATES, type CompensationRates, type CompRateTable } from './va-rates'

const USER_AGENT = 'PatriotOpsCenter-KnowledgeSync/1.0 (+https://patriot7six.com)'

export type FetchResult =
  | { ok: true;  rates: CompensationRates }
  | { ok: false; error: string }

export async function fetchLiveCompensationRates(): Promise<FetchResult> {
  let html: string
  try {
    const res = await fetch(COMPENSATION_RATES.source_url, {
      headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    html = await res.text()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  const effective = parseEffectiveDate(html)
  if (!effective) return { ok: false, error: 'effective-date not found on va.gov page' }

  const no_deps                   = parseRatingTable(html, ['veteran alone', 'without a spouse', 'no dependents'])
  const with_spouse               = parseRatingTable(html, ['with spouse only', 'veteran with spouse'])
  const with_spouse_and_one_child = parseRatingTable(html, ['with spouse and 1 child', 'spouse and one child'])

  if (!no_deps || !with_spouse || !with_spouse_and_one_child) {
    return { ok: false, error: 'rate-table parse failure — va.gov HTML structure may have changed' }
  }

  if (!sanityCheck(no_deps, { min: 10, max: 100 }) ||
      !sanityCheck(with_spouse, { min: 30, max: 100 }) ||
      !sanityCheck(with_spouse_and_one_child, { min: 30, max: 100 })) {
    return { ok: false, error: 'sanity check failed — rates not monotonic by rating' }
  }

  return {
    ok: true,
    rates: {
      rate_year:      COMPENSATION_RATES.rate_year,  // not in HTML; carry forward
      effective_date: effective,
      cola_pct:       COMPENSATION_RATES.cola_pct,   // not in HTML; carry forward
      source_url:     COMPENSATION_RATES.source_url,
      no_deps,
      with_spouse,
      with_spouse_and_one_child,
    },
  }
}

function parseEffectiveDate(html: string): string | null {
  const m = html.match(/effective\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i)
  return m ? m[0].replace(/^effective\s+/i, '').trim() : null
}

function parseRatingTable(html: string, anchors: string[]): CompRateTable | null {
  const lower = html.toLowerCase()
  let anchorIdx = -1
  for (const a of anchors) {
    anchorIdx = lower.indexOf(a.toLowerCase())
    if (anchorIdx !== -1) break
  }
  if (anchorIdx === -1) return null

  const tableStart = html.indexOf('<table', anchorIdx)
  if (tableStart === -1) return null
  const tableEnd = html.indexOf('</table>', tableStart)
  if (tableEnd === -1) return null
  const table = html.slice(tableStart, tableEnd)

  const result: CompRateTable = {}
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  for (const rowMatch of table.matchAll(rowRe)) {
    const row = rowMatch[1]
    const cells: string[] = []
    const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
    for (const cellMatch of row.matchAll(cellRe)) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
    }
    if (cells.length < 2) continue
    const rating = /^(\d{2,3})\s*%/.exec(cells[0])
    // First $ amount in the row — va.gov's table may have multiple columns but
    // the first dollar figure is the payment column.
    const amount = /\$\s*([\d,]+\.\d{2})/.exec(cells.slice(1).join(' '))
    if (rating && amount) {
      result[Number(rating[1])] = Number(amount[1].replace(/,/g, ''))
    }
  }
  return Object.keys(result).length >= 5 ? result : null
}

function sanityCheck(table: CompRateTable, bounds: { min: number; max: number }): boolean {
  const entries = Object.entries(table)
    .map(([r, v]) => [Number(r), v] as const)
    .sort((a, b) => a[0] - b[0])
  if (entries.length < 5) return false
  if (entries[0][0] < bounds.min || entries[entries.length - 1][0] > bounds.max) return false
  for (let i = 1; i < entries.length; i++) {
    if (entries[i][1] <= entries[i - 1][1]) return false  // must strictly increase
  }
  // No payment should exceed $10k/month — guards against decimal-parse errors.
  if (entries.some(([, v]) => v <= 0 || v > 10000)) return false
  return true
}

// Compare two rate structs and return a human-readable diff summary for logs.
export function diffRates(a: CompensationRates, b: CompensationRates): string[] {
  const diffs: string[] = []
  if (a.effective_date !== b.effective_date) {
    diffs.push(`effective_date: ${a.effective_date} → ${b.effective_date}`)
  }
  for (const key of ['no_deps', 'with_spouse', 'with_spouse_and_one_child'] as const) {
    const tableA = a[key], tableB = b[key]
    const ratings = new Set([...Object.keys(tableA), ...Object.keys(tableB)].map(Number))
    for (const r of Array.from(ratings).sort((x, y) => x - y)) {
      if (tableA[r] !== tableB[r]) {
        diffs.push(`${key}[${r}%]: ${tableA[r] ?? '—'} → ${tableB[r] ?? '—'}`)
      }
    }
  }
  return diffs
}
