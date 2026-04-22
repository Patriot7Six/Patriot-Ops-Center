// Live-fetches VA disability compensation rates from va.gov and returns them
// in the same shape as COMPENSATION_RATES. Used by the weekly knowledge-sync
// job as a self-healing layer: if committed rates drift from va.gov between
// annual updates, the fetcher catches it and the sync pushes the live values
// to Supabase (committed values remain the reviewable fallback).
//
// Design principle: fail safe. Any error, parse miss, or failed sanity check
// returns { ok: false } and the caller uses COMPENSATION_RATES verbatim.
//
// va.gov renders rates inside <va-table> web components (not plain <table>).
// The 10-20% table is "tall" (rows are ratings). The 30-60% and 70-100%
// tables are "wide" (columns are ratings, rows are dependent status). Both
// shapes are handled.

import { COMPENSATION_RATES, type CompensationRates, type CompRateTable } from './va-rates'

const USER_AGENT = 'PatriotOpsCenter-KnowledgeSync/1.0 (+https://patriot7six.com)'

export type FetchResult =
  | { ok: true;  rates: CompensationRates }
  | { ok: false; error: string }

type RateTarget = 'no_deps' | 'with_spouse' | 'with_spouse_and_one_child'

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

  const rates: CompensationRates = {
    rate_year:                 COMPENSATION_RATES.rate_year,    // not in HTML
    effective_date:            effective,
    cola_pct:                  COMPENSATION_RATES.cola_pct,     // not in HTML
    source_url:                COMPENSATION_RATES.source_url,
    no_deps:                   {},
    with_spouse:               {},
    with_spouse_and_one_child: {},
  }

  const tableRe = /<va-table\b([^>]*)>([\s\S]*?)<\/va-table>/gi
  for (const m of html.matchAll(tableRe)) {
    const attrs = m[1]
    const inner = m[2]
    const titleMatch = /table-title=["']([^"']*)["']/i.exec(attrs)
    const title = titleMatch?.[1] ?? ''
    // Skip "Added amounts" tables; accept empty titles (10-20% table) and
    // "Basic monthly rates" titles.
    if (title && !/^basic monthly rates/i.test(title)) continue
    parseVaTableInto(inner, rates)
  }

  const EXPECTED_NO_DEPS     = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  const EXPECTED_WITH_DEPS   = [30, 40, 50, 60, 70, 80, 90, 100]
  if (!hasAllRatings(rates.no_deps,                   EXPECTED_NO_DEPS)   ||
      !hasAllRatings(rates.with_spouse,               EXPECTED_WITH_DEPS) ||
      !hasAllRatings(rates.with_spouse_and_one_child, EXPECTED_WITH_DEPS)) {
    return { ok: false, error: 'rate-table parse incomplete — expected rating cells not found' }
  }

  if (!sanityCheck(rates.no_deps)                   ||
      !sanityCheck(rates.with_spouse)               ||
      !sanityCheck(rates.with_spouse_and_one_child)) {
    return { ok: false, error: 'sanity check failed — rates not monotonic by rating or out of bounds' }
  }

  return { ok: true, rates }
}

function parseEffectiveDate(html: string): string | null {
  const m = html.match(/effective\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i)
  return m ? m[0].replace(/^effective\s+/i, '').trim() : null
}

function parseVaTableInto(inner: string, rates: CompensationRates): void {
  const rows: string[][] = []
  const rowRe = /<va-table-row\b[^>]*>([\s\S]*?)<\/va-table-row>/gi
  for (const rowMatch of inner.matchAll(rowRe)) {
    const row = rowMatch[1]
    const cells: string[] = []
    const spanRe = /<span\b[^>]*>([\s\S]*?)<\/span>/gi
    for (const cellMatch of row.matchAll(spanRe)) {
      cells.push(stripTags(cellMatch[1]))
    }
    if (cells.length > 0) rows.push(cells)
  }
  if (rows.length < 2) return

  const header = rows[0]
  const headerRatings = header.slice(1).map(extractRating)
  const isWide = headerRatings.some(r => r !== null)

  if (isWide) {
    // Columns are ratings; rows are dependent-status labels.
    for (const row of rows.slice(1)) {
      const target = matchLabelToTarget(row[0])
      if (!target) continue
      for (let i = 0; i < headerRatings.length; i++) {
        const rating = headerRatings[i]
        if (rating === null) continue
        const amount = parseAmount(row[i + 1])
        if (amount !== null) rates[target][rating] = amount
      }
    }
    return
  }

  // Tall format: column 0 is rating, column 1 is amount. Only used by the
  // 10-20% table on va.gov, which is no_deps by definition (note on page
  // explicitly says dependents don't raise the rate at 10-20%).
  for (const row of rows.slice(1)) {
    const rating = extractRating(row[0])
    if (rating === null) continue
    const amount = parseAmount(row[1])
    if (amount !== null) rates.no_deps[rating] = amount
  }
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#xa0;/gi, ' ')
    .replace(/&#x2019;/gi, '’')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractRating(cell: string): number | null {
  const m = /(\d{2,3})\s*%/.exec(cell)
  if (!m) return null
  const n = Number(m[1])
  return (n >= 10 && n <= 100 && n % 10 === 0) ? n : null
}

function parseAmount(cell: string | undefined): number | null {
  if (!cell) return null
  const m = /([\d,]+\.\d{2})/.exec(cell)
  if (!m) return null
  const n = Number(m[1].replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function matchLabelToTarget(label: string): RateTarget | null {
  const norm = label.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
  if (norm === 'veteran alone')            return 'no_deps'
  if (norm === 'with spouse')              return 'with_spouse'
  if (norm === 'with 1 child and spouse')  return 'with_spouse_and_one_child'
  return null
}

function hasAllRatings(table: CompRateTable, expected: number[]): boolean {
  return expected.every(r => typeof table[r] === 'number')
}

function sanityCheck(table: CompRateTable): boolean {
  const entries = Object.entries(table)
    .map(([r, v]) => [Number(r), v] as const)
    .sort((a, b) => a[0] - b[0])
  if (entries.length < 5) return false
  for (let i = 1; i < entries.length; i++) {
    if (entries[i][1] <= entries[i - 1][1]) return false  // must strictly increase
  }
  // No single monthly payment should exceed $10k — guards against decimal-parse errors.
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
