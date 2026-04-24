// trigger/jobs/expire-cases.ts
// Nightly: transition any 'open' case past its expires_at to 'expired'.
// Cases default to a 14-day window (set in the migration) — after that,
// the veteran sees a "no agent picked this up" state and can resubmit.
//
// We also send a follow-up email via Resend (Sprint 10 wires the template).

import { schedules } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import { transitionCase } from '../../src/lib/referral-cases'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export const expireStaleCasesScheduled = schedules.task({
  id: 'expire-stale-cases',
  cron: '0 3 * * *', // 03:00 UTC daily
  machine: { preset: 'small-1x' },
  run: async () => {
    const supabase = getServiceClient()

    const { data: stale, error } = await supabase
      .from('referral_cases')
      .select('id')
      .eq('status', 'open')
      .lt('expires_at', new Date().toISOString())

    if (error) throw error
    if (!stale?.length) return { expired: 0 }

    let expired = 0
    for (const row of stale) {
      const result = await transitionCase(
        supabase,
        row.id as string,
        'expired',
        { userId: null, role: 'system' },
        { eventPayload: { reason: 'no_agent_accepted_in_window' } },
      )
      if (result.ok) expired++
    }

    console.log(`[expire-stale-cases] expired ${expired} cases`)
    return { expired }
  },
})
