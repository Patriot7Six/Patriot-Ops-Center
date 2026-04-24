// src/app/api/agent/cases/route.ts
// Agent-facing: list the cases visible to this agent.
// Two subsets:
//   • ?scope=open     — open cases in their practice states (browse inbox)
//   • ?scope=mine     — cases they've accepted
// RLS handles the filtering; this route just fetches + sorts.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rankAgentsForCase } from '@/lib/agent-matching'
import type { Agent, ReferralCase } from '@/types/database'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify this user is a verified agent
  const { data: agentRow } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const agent = agentRow as Agent | null
  if (!agent) {
    return NextResponse.json({ error: 'Not an agent' }, { status: 403 })
  }
  if (agent.status !== 'verified') {
    return NextResponse.json(
      { error: 'Not verified', message: `Agent status is "${agent.status}". Cases unlock after verification.` },
      { status: 403 },
    )
  }

  const scope = req.nextUrl.searchParams.get('scope') ?? 'open'

  let query = supabase.from('referral_cases').select('*')

  if (scope === 'mine') {
    query = query.eq('agent_id', agent.id).order('accepted_at', { ascending: false })
  } else {
    // Open cases: RLS will already restrict to matching practice states,
    // but we add the status filter + ordering.
    query = query
      .eq('status', 'open')
      .order('urgency', { ascending: false, nullsFirst: false })
      .order('submitted_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('GET /api/agent/cases:', error)
    return NextResponse.json({ error: 'Failed to load cases' }, { status: 500 })
  }

  const cases = (data ?? []) as ReferralCase[]

  // For 'open' scope, compute a per-case match score so the UI can sort/
  // badge accordingly. Hydrate open_case_count from mine scope.
  if (scope === 'open') {
    const { count: openMineCount } = await supabase
      .from('referral_cases')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent.id)
      .in('status', ['accepted'])

    const scores = rankAgentsForCase(
      [{ agent, open_case_count: openMineCount ?? 0 }],
      // We pass a pseudo-case; this is a slight abuse of the helper to
      // reuse the scoring math per-case. See below — we call it for each.
      cases[0] ?? ({} as ReferralCase),
    )
    void scores // not directly used; see per-case loop below

    const enriched = cases.map(c => {
      const s = rankAgentsForCase(
        [{ agent, open_case_count: openMineCount ?? 0 }],
        c,
      )[0]
      return { ...c, match_score: s?.score ?? 0, match_reasons: s?.reasons ?? [] }
    })

    // Sort by match score descending
    enriched.sort((a, b) => b.match_score - a.match_score)
    return NextResponse.json({ cases: enriched })
  }

  return NextResponse.json({ cases })
}
