// src/app/api/agent/accept/route.ts
// Agent takes a case. Must be verified, have capacity, practice in the
// case's state. We double-check server-side (not trusting RLS alone) because
// capacity is enforced in application logic, not DB constraints.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { transitionCase } from '@/lib/referral-cases'
import { scoreAgentForCase } from '@/lib/agent-matching'
import type { Agent, ReferralCase } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { caseId } = (await req.json()) as { caseId?: string }
    if (!caseId) {
      return NextResponse.json({ error: 'caseId required' }, { status: 400 })
    }

    // Load agent + case
    const service = await createServiceClient()
    const [{ data: agentRow }, { data: caseRow }] = await Promise.all([
      service.from('agents').select('*').eq('user_id', user.id).maybeSingle(),
      service.from('referral_cases').select('*').eq('id', caseId).maybeSingle(),
    ])

    const agent = agentRow as Agent | null
    const kase = caseRow as ReferralCase | null

    if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })
    if (!kase)  return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    // Count current in-progress cases for this agent
    const { count: openCount } = await service
      .from('referral_cases')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .eq('status', 'accepted')

    const match = scoreAgentForCase(
      { agent, open_case_count: openCount ?? 0 },
      kase,
    )

    if (!match.eligible) {
      return NextResponse.json(
        {
          error: 'not_eligible',
          message: match.reasons.join('; '),
        },
        { status: 403 },
      )
    }

    // Race-safe transition: only succeed if still 'open'
    const result = await transitionCase(service, kase.id, 'accepted',
      { userId: user.id, role: 'agent' },
      { agent_id: agent.id, eventPayload: { match_score: match.score } },
    )

    if (!result.ok) {
      return NextResponse.json(
        {
          error: 'transition_failed',
          message: result.error,
        },
        { status: 409 },
      )
    }

    return NextResponse.json({ case: result.case })
  } catch (err) {
    console.error('POST /api/agent/accept:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
