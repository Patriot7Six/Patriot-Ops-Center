// src/app/api/agent/decline/route.ts
// An agent passes on a case. Doesn't change case state — the case stays
// 'open' for other agents. We record the decline so we can A/B test whether
// declines correlate with case attributes (low strength, rural state, etc.).

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logCaseEvent } from '@/lib/referral-cases'
import type { Agent } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { caseId, reason } = (await req.json()) as {
      caseId?: string
      reason?: string
    }
    if (!caseId) return NextResponse.json({ error: 'caseId required' }, { status: 400 })

    const service = await createServiceClient()
    const { data: agentRow } = await service
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const agent = agentRow as Agent | null
    if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })

    await logCaseEvent(service, {
      caseId,
      eventType:   'declined',
      actorUserId: user.id,
      actorRole:   'agent',
      payload:     { agent_id: agent.id, reason: reason ?? '' },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/agent/decline:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
