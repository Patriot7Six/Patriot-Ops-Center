import Stripe from 'stripe'
import type { SubscriptionTier } from '@/types/database'

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return _stripe
}

export interface PlanFeature {
  text: string
  included: boolean
}

export interface Plan {
  tier: SubscriptionTier
  name: string
  price: number       // monthly USD dollars
  priceId: string
  description: string
  badge?: string
  features: PlanFeature[]
  cta: string
}

export const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'Patriot',
    price: 0,
    priceId: '',
    description: 'Get started with basic benefits navigation.',
    features: [
      { text: 'Benefits Navigator hub',           included: true  },
      { text: 'VA Eligibility Checker (5/month)', included: true  },
      { text: 'Claims Copilot (3/month)',          included: true  },
      { text: 'Community access',                 included: true  },
      { text: 'Document upload',                  included: false },
      { text: 'Career transition toolkit',        included: false },
      { text: 'Priority claim reviews',           included: false },
      { text: 'Dedicated success advisor',        included: false },
    ],
    cta: 'Current Plan',
  },
  {
    tier: 'elite',
    name: 'Special Ops',
    price: 124,
    priceId: process.env.STRIPE_PRICE_ELITE_MONTHLY!,
    description: 'Unlimited AI tools, priority claim reviews, and white-glove advisor support.',
    badge: 'Most Popular',
    features: [
      { text: 'Everything in Patriot',             included: true },
      { text: 'Unlimited VA Eligibility checks',   included: true },
      { text: 'Unlimited Claims Copilot',          included: true },
      { text: 'Document upload & AI analysis',     included: true },
      { text: 'Career transition toolkit',         included: true },
      { text: 'Priority claim reviews',            included: true },
      { text: 'Dedicated success advisor',         included: true },
      { text: '1-on-1 strategy sessions (2/mo)',   included: true },
      { text: 'White-glove document review',       included: true },
      { text: 'Concierge escalation support',      included: true },
    ],
    cta: 'Start Special Ops',
  },
]

export function getPlanByTier(tier: SubscriptionTier): Plan {
  return PLANS.find(p => p.tier === tier) ?? PLANS[0]
}

export type FeatureKey =
  | 'va_eligibility_unlimited'
  | 'claims_copilot_unlimited'
  | 'document_upload'
  | 'career_toolkit'
  | 'priority_reviews'
  | 'dedicated_advisor'

const FEATURE_MAP: Record<SubscriptionTier, FeatureKey[]> = {
  free:  [],
  elite: ['va_eligibility_unlimited', 'claims_copilot_unlimited', 'document_upload', 'career_toolkit', 'priority_reviews', 'dedicated_advisor'],
}

export function hasFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
  return FEATURE_MAP[tier].includes(feature)
}

export function formatPrice(dollars: number): string {
  return dollars === 0 ? 'Free' : `$${dollars}`
}
