'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hasFeature } from '@/lib/stripe'
import type { Subscription, SubscriptionTier } from '@/types/database'
import type { FeatureKey } from '@/lib/stripe'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  tier: SubscriptionTier
  isLoading: boolean
  isPro: boolean
  isElite: boolean
  can: (feature: FeatureKey) => boolean
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let userId: string

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsLoading(false); return }
      userId = user.id

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSubscription(data)
      setIsLoading(false)

      // Realtime subscription updates (e.g., after Stripe checkout completes)
      const channel = supabase
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` },
          payload => setSubscription(payload.new as Subscription),
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    init()
  }, [])

  const tier = subscription?.tier ?? 'free'
  const isActive = !subscription || ['active', 'trialing'].includes(subscription.status ?? '')

  return {
    subscription,
    tier: isActive ? tier : 'free',
    isLoading,
    isPro: isActive && (tier === 'pro' || tier === 'elite'),
    isElite: isActive && tier === 'elite',
    can: (feature: FeatureKey) => isActive && hasFeature(tier, feature),
  }
}
