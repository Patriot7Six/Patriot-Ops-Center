// src/app/api/agent/outcome/route.ts
// Agent reports the final outcome of an accepted case. This is the billing
// trigger in Sprint 10 — $250 charged on 'won'. For v1 we just transition
// state and log; the billing webhook wires into this in a later sprint.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { transitionCase } from '@/lib/referral-cases'
import type { Agent, ReferralCase } from '@/types/database'

type Outcome = 'won' | 'lost'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as {
      caseId?: string
      outcome?: Outcome
      backpay_cents?: number
      notes?: string
    }

    if (!body.caseId) {
      return NextResponse.json({ error: 'caseId required' }, { status: 400 })
    }
    if (body.outcome !== 'won' && body.outcome !== 'lost') {
      return NextResponse.json(
        { error: 'outcome must be "won" or "lost"' },
        { status: 400 },
      )
    }

    // Confirm this agent owns the case
    const service = await createServiceClient()
    const [{ data: agentRow }, { data: caseRow }] = await Promise.all([
      service.from('agents').select('*').eq('user_id', user.id).maybeSingle(),
      service.from('referral_cases').select('*').eq('id', body.caseId).maybeSingle(),
    ])

    const agent = agentRow as Agent | null
    const kase = caseRow as ReferralCase | null

    if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })
    if (!kase)  return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    if (kase.agent_id !== agent.id) {
      return NextResponse.json(
        { error: 'Not your case' },
        { status: 403 },
      )
    }

    const result = await transitionCase(service, kase.id, body.outcome,
      { userId: user.id, role: 'agent' },
      {
        outcome_backpay_cents: body.backpay_cents,
        outcome_notes: body.notes,
      },
    )

    if (!result.ok) {
      return NextResponse.json(
        { error: 'transition_failed', message: result.error },
        { status: 409 },
      )
    }

    // TODO (Sprint 10): if outcome === 'won', enqueue a per-case billing
    // job that creates a $250 invoice against the agent's stripe_customer_id.
    // Intentionally deferred — we want real agents before real invoices.

    return NextResponse.json({ case: result.case })
  } catch (err) {
    console.error('POST /api/agent/outcome:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
