// trigger/jobs/ogc-sync.ts
// Syncs the OGC public accreditation roster into ogc_accreditations.
//
// Schedule: every Tue / Thu / Sat at 06:00 UTC — OGC publishes new data
// Mon / Wed / Fri evening, so this catches fresh data on the next business
// morning without hammering VA.gov.
//
// Data source: https://www.va.gov/ogc/apps/accreditation/
// Downloads three Excel files (Attorneys, Claims_Agents, VSO_Reps). VSO
// reps aren't accepted as agents in our platform (they work for free via
// organizations) so we ingest Attorneys + Claims_Agents only in v1.
//
// The URL paths aren't officially documented; if they change, set the env
// vars below to the correct paths. Defaults are based on the Apr 2026 site.

import { task, schedules } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import type { AgentRole } from '../../src/types/database'

// URL fragments live in env so maintainers can adjust without a redeploy if
// OGC changes the endpoints. The .asp endpoints are what the accreditation
// page's download form targets. Despite the Content-Type of
// application/vnd.ms-excel, the actual payload is an HTML <TABLE> — Excel
// opens HTML tables natively and renders them as a spreadsheet, which is
// why VA uses this format. Env var names are format-neutral so a future
// move to true XLSX/CSV/XLS wouldn't require renaming.
const OGC_URLS: Record<AgentRole, string> = {
  attorney:     process.env.OGC_ATTORNEYS_URL     ?? 'https://www.va.gov/ogc/apps/accreditation/attorneyexcellist.asp',
  claims_agent: process.env.OGC_CLAIMS_AGENTS_URL ?? 'https://www.va.gov/ogc/apps/accreditation/caexcellist.asp',
}

// Format sniffing: VA currently serves HTML masquerading as XLS
// (Content-Type says vnd.ms-excel, body is <HTML><TABLE>...). We detect
// by byte header so a real XLS/XLSX swap would be handled automatically.
//   XLS  — OLE compound document signature
//   XLSX — ZIP archive (starts with "PK")
//   HTML — starts with "<" (usually <HTML or <TABLE after leading whitespace)
const OLE_SIGNATURE = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

type SpreadsheetFormat = 'xls' | 'xlsx' | 'html' | 'unknown'

function detectSpreadsheetFormat(buffer: ArrayBuffer): SpreadsheetFormat {
  const head = new Uint8Array(buffer, 0, Math.min(128, buffer.byteLength))
  if (head.length >= 8 && OLE_SIGNATURE.every((b, i) => head[i] === b)) return 'xls'
  if (head.length >= 2 && head[0] === 0x50 && head[1] === 0x4b) return 'xlsx'
  const sniff = new TextDecoder('utf-8', { fatal: false }).decode(head).toLowerCase()
  if (sniff.includes('<html') || sniff.includes('<table')) return 'html'
  return 'unknown'
}

const BATCH_SIZE = 500 // Supabase handles larger but smaller = gentler RAM footprint in Trigger

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

interface OGCRow {
  accreditation_number: string | null
  role:                 AgentRole
  first_name:           string
  last_name:            string
  city:                 string | null
  state:                string | null
  postal_code:          string | null
  phone:                string | null
  email:                string | null
  organization:         string | null
  source_file:          string
}

// Column names vary slightly between the Attorneys and Claims Agents sheets.
// Normalize a few common variants here. If a column is missing, we return
// null — the DB accepts that.
//
// Excel's HTML export prefixes numeric-looking strings with a single quote
// (e.g. '87124 for a ZIP) so Excel treats them as text and preserves leading
// zeros. We strip that prefix so the DB stores clean values.
function pickCol(row: Record<string, unknown>, candidates: string[]): string | null {
  for (const c of candidates) {
    const v = row[c]
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim().replace(/^'/, '')
    }
  }
  return null
}

function parseSheet(
  buffer: ArrayBuffer,
  role: AgentRole,
  sourceUrl: string,
): OGCRow[] {
  const format = detectSpreadsheetFormat(buffer)
  console.log(`[ogc-sync] Detected ${role} format: ${format} (${buffer.byteLength} bytes)`)
  if (format === 'unknown') {
    throw new Error(
      `OGC ${role} download format unrecognized — OGC likely changed endpoints. First bytes: ${
        Array.from(new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ')
      }`,
    )
  }

  // SheetJS parses XLS/XLSX from binary and HTML tables from string.
  // Branch based on detected format; both result in a WorkBook we can
  // convert to row objects via sheet_to_json.
  let workbook: XLSX.WorkBook
  if (format === 'html') {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(buffer))
    workbook = XLSX.read(text, { type: 'string' })
  } else {
    workbook = XLSX.read(buffer, { type: 'array', dense: true })
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: null })

  const parsed: OGCRow[] = []

  for (const raw of rows) {
    const first = pickCol(raw, ['First Name', 'FirstName', 'First'])
    const last  = pickCol(raw, ['Last Name', 'LastName', 'Last'])

    // Skip blank/header rows
    if (!first || !last) continue

    parsed.push({
      accreditation_number: pickCol(raw, ['Accreditation Number', 'AccreditationNumber', 'OGC Number', 'Registration Num', 'Registration Number']),
      role,
      first_name:   first,
      last_name:    last,
      city:         pickCol(raw, ['City']),
      state:        pickCol(raw, ['State', 'ST'])?.toUpperCase() ?? null,
      postal_code:  pickCol(raw, ['Postal Code', 'Zip', 'ZipCode']),
      phone:        pickCol(raw, ['Phone', 'Phone Number']),
      email:        pickCol(raw, ['Email', 'Email Address'])?.toLowerCase() ?? null,
      organization: pickCol(raw, ['Organization', 'Firm', 'Firm Name', 'VSO']),
      source_file:  sourceUrl,
    })
  }

  return parsed
}

async function ingestRole(role: AgentRole) {
  const url = OGC_URLS[role]
  console.log(`[ogc-sync] Fetching ${role} from ${url}`)

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`OGC fetch for ${role} failed: ${res.status} ${res.statusText}`)
  }
  const buffer = await res.arrayBuffer()
  const rows = parseSheet(buffer, role, url)

  console.log(`[ogc-sync] Parsed ${rows.length} rows for ${role}`)

  // VA's OGC roster ships an accreditation number (Registration Num) for
  // every row. Rows without one are parsing oddities (e.g. section breaks)
  // and get skipped rather than inserted without a natural key.
  const valid = rows.filter(r => r.accreditation_number)
  const skipped = rows.length - valid.length
  if (skipped > 0) {
    console.warn(`[ogc-sync] Skipped ${skipped} ${role} rows with no accreditation_number`)
  }

  const supabase = getServiceClient()
  let upserted = 0
  let failed = 0

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('ogc_accreditations')
      .upsert(batch, { onConflict: 'accreditation_number,role' })
    if (error) {
      console.error('[ogc-sync] upsert failed:', error)
      failed += batch.length
    } else {
      upserted += batch.length
    }
  }

  return { role, upserted, failed, total: rows.length, skipped }
}

async function runSync() {
  const results = await Promise.all([
    ingestRole('attorney'),
    ingestRole('claims_agent'),
  ])

  console.log('[ogc-sync] Done', results)

  // After ingesting, re-check pending agent applications. If any new OGC
  // rows match an existing pending agent, flip them to verified automatically.
  const supabase = getServiceClient()
  await reverifyPendingAgents(supabase)

  return { results }
}

async function reverifyPendingAgents(supabase: ReturnType<typeof getServiceClient>) {
  const { data: pendings } = await supabase
    .from('agents')
    .select('id, role, full_name, bar_state, practice_states, ogc_accreditation_number')
    .eq('status', 'pending_verification')

  if (!pendings?.length) return

  let autoVerified = 0
  for (const p of pendings) {
    const parts = (p.full_name as string).trim().split(/\s+/)
    const first_name = parts[0]
    const last_name  = parts.slice(-1)[0]

    // Try accreditation number, then name+state
    let match = null
    if (p.ogc_accreditation_number) {
      const { data } = await supabase
        .from('ogc_accreditations')
        .select('id')
        .eq('accreditation_number', p.ogc_accreditation_number)
        .eq('role', p.role)
        .maybeSingle()
      match = data
    }

    if (!match) {
      const state = p.bar_state ?? (p.practice_states as string[])[0]
      if (state) {
        const { data } = await supabase
          .from('ogc_accreditations')
          .select('id')
          .ilike('first_name', first_name)
          .ilike('last_name', last_name)
          .eq('state', state)
          .eq('role', p.role)
          .maybeSingle()
        match = data
      }
    }

    if (match) {
      await supabase
        .from('agents')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verification_source: 'ogc_auto',
          ogc_last_seen_at: new Date().toISOString(),
          admin_notes: 'Auto-verified via ogc-sync background run',
        })
        .eq('id', p.id)
      autoVerified++
    }
  }

  console.log(`[ogc-sync] Auto-verified ${autoVerified} pending agents`)
}

// Manual / on-demand trigger
export const syncOGCJob = task({
  id: 'sync-ogc',
  machine: { preset: 'small-1x' },
  run: async () => runSync(),
})

// Scheduled — Tue / Thu / Sat at 06:00 UTC (OGC publishes Mon / Wed / Fri pm)
export const syncOGCScheduled = schedules.task({
  id: 'sync-ogc-scheduled',
  cron: '0 6 * * 2,4,6',
  machine: { preset: 'small-1x' },
  run: async () => runSync(),
})
