export type SubscriptionTier = 'free' | 'pro' | 'elite'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

export interface Profile {
  id: string
  full_name: string | null
  branch: string | null
  rank: string | null
  mos: string | null
  ets_date: string | null
  avatar_url: string | null
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  tier: SubscriptionTier
  status: SubscriptionStatus | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}
