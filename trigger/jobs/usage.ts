// trigger/jobs/usage.ts
import { schedules } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Monthly usage reset — runs at midnight on the 1st of every month ─────────
// Resets the usage_counters table so free-tier users get their monthly
// allowance of VA eligibility checks and Claims Copilot uses.
export const monthlyUsageResetJob = schedules.task({
  id: 'monthly-usage-reset',
  // Cron: midnight UTC on the 1st of every month
  cron: '0 0 1 * *',
  run: async () => {
    const currentMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
    const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .slice(0, 7)

    // Delete counters from the previous month — current month starts fresh
    const { error, count } = await supabase
      .from('usage_counters')
      .delete()
      .eq('month', previousMonth)

    if (error) throw error

    console.log(`Monthly usage reset: deleted ${count ?? 0} counters for ${previousMonth}`)
    return { reset: true, month: currentMonth, deletedMonth: previousMonth, rowsDeleted: count }
  },
})

// ── Weekly usage summary — every Monday for Pro/Elite users ──────────────────
// Gives users visibility into how much of their quota they've used
// (useful for Pro users approaching rate limits)
export const weeklyUsageSummaryJob = schedules.task({
  id: 'weekly-usage-summary',
  // Every Monday at 9am UTC
  cron: '0 9 * * 1',
  run: async () => {
    const currentMonth = new Date().toISOString().slice(0, 7)

    // Get all users with usage this month
    const { data: usageRows } = await supabase
      .from('usage_counters')
      .select('user_id, feature, count')
      .eq('month', currentMonth)

    if (!usageRows?.length) return { skipped: true }

    // Group by user
    const byUser = usageRows.reduce<Record<string, Record<string, number>>>((acc, row) => {
      if (!acc[row.user_id]) acc[row.user_id] = {}
      acc[row.user_id][row.feature] = row.count
      return acc
    }, {})

    // Could trigger per-user summary emails here
    // For now just log — extend as needed
    console.log(`Weekly usage summary: ${Object.keys(byUser).length} active users in ${currentMonth}`)
    return { month: currentMonth, activeUsers: Object.keys(byUser).length }
  },
})
