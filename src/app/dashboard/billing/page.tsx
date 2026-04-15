'use client'
import { useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { PLANS, formatPrice, getPlanByTier } from '@/lib/stripe'
import { useSubscription } from '@/hooks/useSubscription'
import type { Plan } from '@/lib/stripe'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export default function BillingPage() {
  const params = useSearchParams()
  const { subscription, tier, isLoading } = useSubscription()

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-16 border-b border-white/[0.06] px-6 lg:px-8 flex items-center shrink-0">
        <h1 className="text-white font-semibold">Billing & Plans</h1>
      </header>

      <div className="p-6 lg:p-8 space-y-8 max-w-4xl">
        {/* Success / Cancel banners */}
        {params.get('success') && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 text-sm text-emerald-400">
            🎉 Subscription activated! Welcome to {getPlanByTier(tier).name}.
          </div>
        )}
        {params.get('canceled') && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-slate-400">
            Checkout canceled. Your plan hasn't changed.
          </div>
        )}

        {/* Current Plan Card */}
        {!isLoading && subscription && tier !== 'free' && (
          <CurrentPlanCard subscription={subscription} tier={tier} />
        )}

        {/* Plan Grid */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <PlanCard key={plan.tier} plan={plan} currentTier={tier} isLoading={isLoading} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function CurrentPlanCard({ subscription, tier }: { subscription: ReturnType<typeof useSubscription>['subscription'], tier: string }) {
  const [isPending, startTransition] = useTransition()

  const openPortal = () => {
    startTransition(async () => {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    })
  }

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs text-slate-500 mb-1">Current Plan</p>
        <p className="text-xl font-bold text-white capitalize">{getPlanByTier(tier as 'free' | 'pro' | 'elite').name}</p>
        {periodEnd && (
          <p className="text-xs text-slate-500 mt-1">
            {subscription?.cancel_at_period_end ? `Cancels ${periodEnd}` : `Renews ${periodEnd}`}
          </p>
        )}
      </div>
      <Button variant="secondary" size="sm" onClick={openPortal} disabled={isPending}>
        {isPending ? <Spinner size="sm" /> : 'Manage Subscription →'}
      </Button>
    </div>
  )
}

function PlanCard({ plan, currentTier, isLoading }: { plan: Plan; currentTier: string; isLoading: boolean }) {
  const [isPending, startTransition] = useTransition()
  const isCurrent = plan.tier === currentTier

  const handleCheckout = () => {
    if (isCurrent || plan.tier === 'free' || isLoading) return
    startTransition(async () => {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: plan.tier }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    })
  }

  return (
    <div className={`relative rounded-2xl border flex flex-col overflow-hidden transition-all ${
      isCurrent ? 'border-gold-500/40 bg-gold-500/5'
      : plan.badge ? 'border-gold-500/20 bg-white/[0.03]'
      : 'border-white/[0.07] bg-white/[0.02]'
    }`}>
      {plan.badge && !isCurrent && (
        <div className="absolute top-4 right-4">
          <span className="text-xs font-bold text-navy-950 bg-gold-500 px-2.5 py-1 rounded-full">{plan.badge}</span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
      )}

      <div className="p-6 flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{plan.name}</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-3xl font-extrabold text-white">{formatPrice(plan.price)}</span>
          {plan.price > 0 && <span className="text-slate-500 text-sm">/mo</span>}
        </div>
        <p className="text-xs text-slate-500 mb-5">{plan.description}</p>

        <ul className="space-y-2.5">
          {plan.features.map(f => (
            <li key={f.text} className="flex items-start gap-2.5">
              <svg
                className={`w-4 h-4 mt-0.5 shrink-0 ${f.included ? 'text-gold-400' : 'text-slate-700'}`}
                fill="currentColor" viewBox="0 0 20 20"
              >
                {f.included
                  ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 14l-4.121-4.121a1 1 0 111.414-1.414L8.414 11.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
                  : <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                }
              </svg>
              <span className={`text-xs ${f.included ? 'text-slate-300' : 'text-slate-600'}`}>{f.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 pt-0">
        {isCurrent ? (
          <div className="w-full py-2.5 rounded-xl border border-gold-500/30 text-center text-xs font-semibold text-gold-400">
            Current Plan
          </div>
        ) : plan.tier === 'free' ? (
          <div className="w-full py-2.5 rounded-xl border border-white/10 text-center text-xs font-semibold text-slate-600">
            Downgrade via portal
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleCheckout}
            disabled={isPending || isLoading}
          >
            {isPending ? <Spinner size="sm" /> : plan.cta}
          </Button>
        )}
      </div>
    </div>
  )
}
