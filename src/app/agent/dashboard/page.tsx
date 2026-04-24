import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Agent } from '@/types/database'

export default async function AgentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/agent/dashboard')

  const { data: agentRow } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!agentRow) redirect('/agent/apply')

  const agent = agentRow as Agent

  // Case counts for this agent
  const [openMine, won, lost] = await Promise.all([
    supabase.from('referral_cases').select('id', { count: 'exact', head: true }).eq('agent_id', agent.id).eq('status', 'accepted'),
    supabase.from('referral_cases').select('id', { count: 'exact', head: true }).eq('agent_id', agent.id).eq('status', 'won'),
    supabase.from('referral_cases').select('id', { count: 'exact', head: true }).eq('agent_id', agent.id).eq('status', 'lost'),
  ])

  // Cases available to them right now (relies on RLS)
  const { count: availableCount } = await supabase
    .from('referral_cases')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')

  const statusBadge = (() => {
    switch (agent.status) {
      case 'verified':             return { label: 'Verified',           tone: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' }
      case 'pending_verification': return { label: 'Pending review',     tone: 'bg-amber-500/10 border-amber-500/30 text-amber-400' }
      case 'suspended':            return { label: 'Suspended',          tone: 'bg-red-500/10 border-red-500/30 text-red-400' }
      case 'rejected':             return { label: 'Rejected',           tone: 'bg-red-500/10 border-red-500/30 text-red-400' }
    }
  })()

  return (
    <main className="min-h-screen bg-navy-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">
              Hello, {agent.full_name.split(' ')[0]}.
            </h1>
            <p className="text-sm text-slate-500">{agent.firm_name ?? (agent.role === 'attorney' ? 'Attorney' : 'Claims agent')}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusBadge.tone}`}>
            {statusBadge.label}
          </span>
        </header>

        {agent.status === 'pending_verification' && (
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
            <p className="font-semibold text-white mb-1">We&apos;re verifying your accreditation</p>
            <p className="text-sm text-slate-400">
              Our system couldn&apos;t auto-match you in the OGC roster. An admin is reviewing —
              most approvals happen within 1 business day. You&apos;ll receive an email when your account goes live.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Active"    value={openMine.count ?? 0} />
          <Stat label="Won"       value={won.count ?? 0} />
          <Stat label="Available" value={availableCount ?? 0} />
          <Stat label="Lost"      value={lost.count ?? 0} />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/agent/cases?scope=open"
            className="block rounded-2xl border border-gold-500/30 bg-gold-500/[0.04] p-6 hover:bg-gold-500/[0.08] transition-colors"
          >
            <h2 className="font-bold text-white mb-1">Browse open cases</h2>
            <p className="text-sm text-slate-400">
              {availableCount ?? 0} case{availableCount === 1 ? '' : 's'} waiting for representation in your practice states.
            </p>
          </Link>
          <Link
            href="/agent/cases?scope=mine"
            className="block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors"
          >
            <h2 className="font-bold text-white mb-1">Your active cases</h2>
            <p className="text-sm text-slate-400">
              {openMine.count ?? 0} in progress. Report outcomes from the case detail page.
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
      <p className="text-3xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}
