'use client'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'
import type { FeatureKey } from '@/lib/stripe'
import { getPlanByTier } from '@/lib/stripe'
import type { SubscriptionTier } from '@/types/database'

// ── Hard gate ─────────────────────────────────────────────────────────────────
interface FeatureGateProps {
  feature: FeatureKey
  requiredTier?: SubscriptionTier
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureGate({ feature, requiredTier = 'pro', children, fallback }: FeatureGateProps) {
  const { can, isLoading } = useSubscription()

  if (isLoading) return <div className="animate-pulse bg-white/5 rounded-xl h-24 w-full" />
  if (can(feature)) return <>{children}</>
  if (fallback) return <>{fallback}</>
  return <UpgradePrompt requiredTier={requiredTier} />
}

function UpgradePrompt({ requiredTier }: { requiredTier: SubscriptionTier }) {
  const plan = getPlanByTier(requiredTier)
  return (
    <div className="relative rounded-xl border border-gold-500/20 bg-gold-500/5 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-0.5">{plan.name} feature</p>
          <p className="text-xs text-slate-400 mb-4">Upgrade to {plan.name} to unlock this and more.</p>
          <Link
            href="/dashboard/billing"
            className="inline-block bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Upgrade to {plan.name} →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Usage-limit gate ──────────────────────────────────────────────────────────
interface UsageLimitGateProps {
  used: number
  limit: number
  feature: FeatureKey
  children: ReactNode
  noun?: string
}

export function UsageLimitGate({ used, limit, feature, children, noun = 'use' }: UsageLimitGateProps) {
  const { can, isLoading } = useSubscription()

  if (isLoading) return <div className="animate-pulse bg-white/5 rounded-xl h-24 w-full" />
  if (can(feature)) return <>{children}</>

  const remaining = Math.max(0, limit - used)
  const exhausted = remaining === 0

  if (exhausted) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-5">
        <p className="text-sm font-semibold text-white mb-1">Monthly limit reached</p>
        <p className="text-xs text-slate-400 mb-4">
          You&apos;ve used all {limit} free {noun}s this month. Upgrade for unlimited access.
        </p>
        <Link
          href="/dashboard/billing"
          className="inline-block bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors"
        >
          Upgrade for unlimited access
        </Link>
      </div>
    )
  }

  return (
    <div>
      {remaining <= 2 && (
        <div className="mb-3 flex items-center justify-between px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-xs text-amber-400">
            {remaining} free {noun}{remaining !== 1 ? 's' : ''} remaining this month
          </span>
          <Link href="/dashboard/billing" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
            Upgrade →
          </Link>
        </div>
      )}
      {children}
    </div>
  )
}
