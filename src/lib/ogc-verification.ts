// src/lib/ogc-verification.ts
// Server-side helper that checks whether a given applicant is on the cached
// OGC roster. Used by /api/agent/apply to auto-verify agents at application
// time, and by the admin panel for manual reconciliation.
//
// Strategy:
//   1. If the applicant provides an OGC accreditation number, match on that
//      first — it's the authoritative natural key.
//   2. Otherwise fall back to fuzzy name + state + role match.
//   3. Return a confidence level so the caller can decide whether to auto-
//      verify or send to admin review.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AgentRole, OGCAccreditation } from '@/types/database'

export interface VerificationRequest {
  first_name: string
  last_name: string
  role: AgentRole
  state?: string                    // applicant's bar/practice state (2-letter)
  ogc_accreditation_number?: string
}

export interface VerificationResult {
  verified: boolean
  confidence: 'high' | 'medium' | 'low' | 'none'
  match?: OGCAccreditation
  reason: string
}

export async function lookupOGC(
  supabase: SupabaseClient,
  req: VerificationRequest,
): Promise<VerificationResult> {
  // 1. Try accreditation number first
  if (req.ogc_accreditation_number?.trim()) {
    const { data } = await supabase
      .from('ogc_accreditations')
      .select('*')
      .eq('accreditation_number', req.ogc_accreditation_number.trim())
      .eq('role', req.role)
      .limit(1)
      .maybeSingle()

    if (data) {
      return {
        verified: true,
        confidence: 'high',
        match: data as OGCAccreditation,
        reason: 'Matched on OGC accreditation number',
      }
    }
  }

  // 2. Fall back to name + state + role
  const { data: candidates } = await supabase
    .from('ogc_accreditations')
    .select('*')
    .ilike('first_name', req.first_name.trim())
    .ilike('last_name', req.last_name.trim())
    .eq('role', req.role)

  if (!candidates?.length) {
    return {
      verified: false,
      confidence: 'none',
      reason: `No OGC record found for ${req.first_name} ${req.last_name} (${req.role})`,
    }
  }

  // If there's exactly one name match in the same state, that's medium-high confidence
  if (req.state) {
    const stateMatch = candidates.find(
      (c: OGCAccreditation) => c.state?.toUpperCase() === req.state?.toUpperCase(),
    )
    if (stateMatch) {
      return {
        verified: true,
        confidence: 'medium',
        match: stateMatch as OGCAccreditation,
        reason: `Matched on name + state (${req.state}) without OGC number`,
      }
    }
  }

  // Multiple candidates or no state info — punt to admin review
  return {
    verified: false,
    confidence: 'low',
    match: candidates[0] as OGCAccreditation,
    reason: `${candidates.length} possible name match(es); admin review required`,
  }
}
