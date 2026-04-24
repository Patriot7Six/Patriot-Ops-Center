// src/app/api/agent/apply/route.ts
// An authenticated user becomes a candidate agent by submitting this form.
// We run an OGC lookup server-side and auto-verify high-confidence matches.
// Low/no confidence matches stay in 'pending_verification' for admin review.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { lookupOGC } from '@/lib/ogc-verification'
import type { AgentRole } from '@/types/database'

const ALLOWED_SPECIALTIES = [
  'ptsd', 'mst', 'tbi', 'pact', 'tdiu',
  'appeals', 'initial_claims', 'secondary_conditions', 'smc',
  'dic', 'caregiver', 'bva', 'cavc',
]

interface ApplyPayload {
  role: AgentRole
  full_name: string
  firm_name?: string
  bar_number?: string
  bar_state?: string
  ogc_accreditation_number?: string
  practice_states: string[]
  specialties: string[]
  bio?: string
  phone?: string
  public_email?: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as Partial<ApplyPayload>

    // ── Validate ──
    if (body.role !== 'attorney' && body.role !== 'claims_agent') {
      return NextResponse.json(
        { error: 'role must be "attorney" or "claims_agent"' },
        { status: 400 },
      )
    }
    if (!body.full_name || body.full_name.trim().length < 2) {
      return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
    }
    if (!Array.isArray(body.practice_states) || body.practice_states.length === 0) {
      return NextResponse.json({ error: 'at least one practice_state required' }, { status: 400 })
    }

    const practice_states = body.practice_states
      .map(s => s.toUpperCase())
      .filter(s => /^[A-Z]{2}$/.test(s))

    const specialties = (body.specialties ?? [])
      .filter(s => ALLOWED_SPECIALTIES.includes(s))

    if (body.role === 'attorney' && (!body.bar_number || !body.bar_state)) {
      return NextResponse.json(
        { error: 'attorneys must provide bar_number and bar_state' },
        { status: 400 },
      )
    }

    // ── Check if a row already exists for this user ──
    const service = await createServiceClient()
    const { data: existing } = await service
      .from('agents')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        {
          error: 'already_applied',
          message: `You already have an agent application (status: ${existing.status}). Use the portal to update.`,
        },
        { status: 409 },
      )
    }

    // ── Parse out first/last name from full_name for OGC lookup ──
    const parts = body.full_name.trim().split(/\s+/)
    const first_name = parts[0] ?? ''
    const last_name = parts.slice(-1)[0] ?? ''

    // ── OGC verification ──
    // Attorneys: lookup by bar_state. Claims agents: by whatever they supplied.
    const lookupState = body.role === 'attorney' ? body.bar_state : practice_states[0]
    const verification = await lookupOGC(service, {
      first_name,
      last_name,
      role: body.role,
      state: lookupState,
      ogc_accreditation_number: body.ogc_accreditation_number,
    })

    // Auto-verify on high confidence. Medium gets verified too but flagged in
    // admin_notes; low goes to admin review.
    const shouldAutoVerify =
      verification.verified &&
      (verification.confidence === 'high' || verification.confidence === 'medium')

    const now = new Date().toISOString()

    const { data: created, error: insertErr } = await service
      .from('agents')
      .insert({
        user_id:                  user.id,
        role:                     body.role,
        status:                   shouldAutoVerify ? 'verified' : 'pending_verification',
        full_name:                body.full_name.trim(),
        firm_name:                body.firm_name?.trim() ?? null,
        bar_number:               body.bar_number?.trim() ?? null,
        bar_state:                body.bar_state?.toUpperCase() ?? null,
        ogc_accreditation_number: body.ogc_accreditation_number?.trim() ?? null,
        practice_states,
        specialties,
        bio:                      body.bio?.trim() ?? null,
        phone:                    body.phone?.trim() ?? null,
        public_email:             body.public_email?.trim() ?? null,
        verified_at:              shouldAutoVerify ? now : null,
        verification_source:      shouldAutoVerify ? 'ogc_auto' : null,
        ogc_last_seen_at:         verification.match ? now : null,
        admin_notes:              verification.confidence === 'medium'
          ? `Auto-verified at medium confidence — ${verification.reason}`
          : !shouldAutoVerify
            ? `Pending review — ${verification.reason}`
            : null,
      })
      .select()
      .single()

    if (insertErr || !created) {
      console.error('agent apply insert failed:', insertErr)
      return NextResponse.json({ error: 'Failed to create agent record' }, { status: 500 })
    }

    // Flip is_agent on the profile so the sidebar can route them to the
    // agent dashboard on next load.
    await service
      .from('profiles')
      .update({ is_agent: true, updated_at: now })
      .eq('id', user.id)

    return NextResponse.json(
      {
        agent: created,
        verification: {
          confidence: verification.confidence,
          reason:     verification.reason,
          auto_verified: shouldAutoVerify,
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('POST /api/agent/apply:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
