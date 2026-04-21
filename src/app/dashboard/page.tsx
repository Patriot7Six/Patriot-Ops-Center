import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPlanByTier } from '@/lib/stripe'
import type { SubscriptionTier } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
  ])

  const tier = (subscription?.tier ?? 'free') as SubscriptionTier
  const plan = getPlanByTier(tier)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Veteran'
  const isNewUser = !profile?.branch

  const separationDate = profile?.ets_date ? new Date(profile.ets_date) : null
  const yearsSeparated = separationDate
    ? Math.floor((Date.now() - separationDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  const QUICK_ACTIONS = [
    {
      href: '/dashboard/eligibility',
      title: 'VA Eligibility Checker',
      description: 'Instantly check what VA benefits you qualify for based on your service record.',
      cta: 'Check Now',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      ),
    },
    {
      href: '/dashboard/claims',
      title: 'Claims Copilot',
      description: 'AI-powered guidance to file stronger VA claims and maximize your disability rating.',
      cta: 'Start Claim',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      ),
    },
    {
      href: '/benefits',
      title: 'Benefits Navigator',
      description: 'Browse the full library of VA, DoD, and state benefits available to you.',
      cta: 'Explore',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      ),
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <header className="h-16 border-b border-white/[0.06] px-6 lg:px-8 flex items-center justify-between shrink-0">
        <h1 className="text-white font-semibold">Dashboard</h1>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
          tier === 'elite' ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
          : tier === 'pro'  ? 'bg-gold-500/10  border-gold-500/30 text-gold-400'
          :                   'bg-white/5 border-white/10 text-slate-400'
        }`}>
          {plan.name}
        </span>
      </header>

      <div className="p-6 lg:p-8 space-y-8 max-w-5xl">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-extrabold text-white">Welcome back, {firstName}.</h2>
          <p className="text-slate-400 mt-1 text-sm">
            {isNewUser
              ? 'Complete your military profile to unlock personalized benefit recommendations.'
              : yearsSeparated !== null
              ? `${yearsSeparated} ${yearsSeparated === 1 ? 'year' : 'years'} since separation — let's maximize what you've earned.`
              : "Let's maximize the benefits you've earned."}
          </p>
        </div>

        {/* Incomplete profile banner */}
        {isNewUser && (
          <div className="relative rounded-2xl border border-gold-500/30 bg-gold-500/5 overflow-hidden p-6 flex items-center gap-5">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
            <div className="flex-1">
              <p className="text-white font-semibold mb-0.5">Complete your military profile</p>
              <p className="text-sm text-slate-400">Add your branch, MOS, and separation date to unlock tailored recommendations.</p>
            </div>
            <Link
              href="/onboarding"
              className="shrink-0 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Complete Profile
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="group block bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-4 group-hover:bg-gold-500/15 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {action.icon}
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{action.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{action.description}</p>
                <span className="text-xs font-semibold text-gold-500">{action.cta} →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Service Profile */}
        {profile?.branch && (
          <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Your Service Profile</h3>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Branch',       value: profile.branch },
                { label: 'MOS / Rate',   value: profile.mos },
                { label: 'Rank',         value: profile.rank },
                { label: 'Separation',   value: separationDate
                    ? separationDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : null },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-sm font-semibold text-white">{stat.value ?? '—'}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upgrade nudge */}
        {tier === 'free' && (
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex items-center gap-6">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">Unlock unlimited access with Ranger</p>
              <p className="text-sm text-slate-400">Unlimited VA checks, Claims Copilot, document upload, and career toolkit.</p>
            </div>
            <Link
              href="/dashboard/billing"
              className="shrink-0 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Upgrade — $34/mo
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}
