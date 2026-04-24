// src/app/api/referrals/submit/route.ts
// Veteran-facing: submit a new referral case. Signed-in veterans only.
//
// Flow:
//   1. Validate input
//   2. Create case in 'submitted' state
//   3. Run auto-screening (v1: simple strength heuristic; Sprint 10 does AI)
//   4. If screening passes, transition 'submitted' → 'open' via state machine
//   5. Return the case for the confirmation page to redirect to

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { transitionCase, logCaseEvent } from '@/lib/referral-cases'
import type { ReferralCase } from '@/types/database'

// Minimum info we need to make the case useful to agents. Anything less
// detailed gets bounced back with a 400.
const MIN_CONDITION_LENGTH = 50

// v1 screening: hand-rolled heuristic. Sprint 10 swaps this for an AI call
// that reads the denial letter (if present) and returns a structured score.
function computeStrengthScore(body: SubmitPayload): number {
  let score = 40 // baseline

  if (body.condition_summary.length >= 200) score += 15
  if (body.denial_summary && body.denial_summary.length >= 100) score += 10
  if (body.current_rating !== undefined && body.current_rating !== null) score += 10
  if (body.specialty_tags.length > 0) score += 10
  if (body.denial_letter_path) score += 15

  return Math.min(100, score)
}

interface SubmitPayload {
  condition_summary: string
  denial_summary?:   string
  current_rating?:   number | null
  requested_rating?: number | null
  state:             string
  specialty_tags:    string[]
  urgency?:          'standard' | 'urgent'
  denial_letter_path?: string
  extra_notes?:      string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as Partial<SubmitPayload>

    // ── Validate ──
    if (!body.condition_summary || body.condition_summary.trim().length < MIN_CONDITION_LENGTH) {
      return NextResponse.json(
        {
          error: 'condition_summary too short',
          message: `Please describe your condition in at least ${MIN_CONDITION_LENGTH} characters so an agent can evaluate.`,
        },
        { status: 400 },
      )
    }
    if (!body.state || body.state.length !== 2) {
      return NextResponse.json({ error: 'state (2-letter code) is required' }, { status: 400 })
    }

    const payload: SubmitPayload = {
      condition_summary:  body.condition_summary.trim(),
      denial_summary:     body.denial_summary?.trim() || undefined,
      current_rating:     body.current_rating ?? null,
      requested_rating:   body.requested_rating ?? null,
      state:              body.state.toUpperCase(),
      specialty_tags:     body.specialty_tags ?? [],
      urgency:            body.urgency ?? 'standard',
      denial_letter_path: body.denial_letter_path,
      extra_notes:        body.extra_notes?.trim() || undefined,
    }

    const strength = computeStrengthScore(payload)

    // ── Insert case as 'submitted' ──
    const service = await createServiceClient()
    const { data: created, error: insertErr } = await service
      .from('referral_cases')
      .insert({
        veteran_user_id:   user.id,
        status:            'submitted',
        condition_summary: payload.condition_summary,
        denial_summary:    payload.denial_summary,
        current_rating:    payload.current_rating,
        requested_rating:  payload.requested_rating,
        state:             payload.state,
        specialty_tags:    payload.specialty_tags,
        urgency:           payload.urgency,
        denial_letter_path:payload.denial_letter_path,
        extra_notes:       payload.extra_notes,
        strength_score:    strength,
      })
      .select()
      .single()

    if (insertErr || !created) {
      console.error('referral_cases insert failed:', insertErr)
      return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
    }

    const kase = created as ReferralCase

    // Write the initial 'submitted' event
    await logCaseEvent(service, {
      caseId:      kase.id,
      eventType:   'submitted',
      actorUserId: user.id,
      actorRole:   'veteran',
      payload:     { strength_score: strength },
    })

    // ── Auto-screen: if strength ≥ 50, open to agents immediately ──
    // Weaker cases stay in 'submitted' for manual admin review. This avoids
    // flooding agents with poorly-developed submissions.
    if (strength >= 50) {
      const result = await transitionCase(service, kase.id, 'open',
        { userId: null, role: 'system' },
        { strength_score: strength, eventPayload: { auto_screened: true } },
      )
      if (result.ok) {
        return NextResponse.json({ case: result.case }, { status: 201 })
      }
    }

    return NextResponse.json({ case: kase, review_pending: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/referrals/submit:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
