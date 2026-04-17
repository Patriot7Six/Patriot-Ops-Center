// src/lib/amplitude.ts
import * as amplitude from '@amplitude/analytics-browser'

let initialized = false

export function initAmplitude() {
  if (initialized || typeof window === 'undefined') return
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) return

  amplitude.init(apiKey, {
    defaultTracking: {
      sessions:   true,
      pageViews:  true,
      formInteractions: false,
      fileDownloads: false,
    },
    autocapture: false,
  })

  initialized = true
}

export function identifyUser(userId: string, traits: {
  tier?: string
  branch?: string
  onboarded?: boolean
}) {
  const id = new amplitude.Identify()
  if (traits.tier)      id.set('subscription_tier', traits.tier)
  if (traits.branch)    id.set('military_branch', traits.branch)
  if (traits.onboarded !== undefined) id.set('onboarded', traits.onboarded)
  amplitude.identify(id)
  amplitude.setUserId(userId)
}

export function resetUser() {
  amplitude.reset()
}

// ── Typed event catalogue ─────────────────────────────────────────────────────

export function trackSignupCompleted(props: {
  plan_intent: 'free' | 'pro' | 'elite'
}) {
  amplitude.track('signup_completed', props)
}

export function trackLoginCompleted(props: {
  method: 'password' | 'magic_link'
}) {
  amplitude.track('login_completed', props)
}

export function trackOnboardingCompleted(props: {
  branch: string
  has_mos: boolean
  has_ets_date: boolean
}) {
  amplitude.track('onboarding_completed', props)
}

export function trackOnboardingSkipped() {
  amplitude.track('onboarding_skipped')
}

export function trackSubscriptionUpgraded(props: {
  from_tier: string
  to_tier: string
  price_usd: number
}) {
  amplitude.track('subscription_upgraded', props)
}

export function trackSubscriptionCanceled(props: {
  tier: string
}) {
  amplitude.track('subscription_canceled', props)
}

export function trackFeatureGateHit(props: {
  feature: string
  user_tier: string
  required_tier: string
}) {
  amplitude.track('feature_gate_hit', props)
}

export function trackAIQuerySent(props: {
  feature: 'va_eligibility' | 'claims_copilot' | 'career_mos' | 'career_resume' | 'career_chat'
  is_followup: boolean
}) {
  amplitude.track('ai_query_sent', props)
}

export function trackDocumentUploaded(props: {
  mime_type: string
  size_mb: number
}) {
  amplitude.track('document_uploaded', props)
}

export function trackDocumentDeleted() {
  amplitude.track('document_deleted')
}

export function trackCareerTabViewed(props: {
  tab: 'mos' | 'resume' | 'chat'
}) {
  amplitude.track('career_tab_viewed', props)
}

export function trackBillingPageViewed() {
  amplitude.track('billing_page_viewed')
}

export function trackCheckoutStarted(props: {
  tier: string
  price_usd: number
}) {
  amplitude.track('checkout_started', props)
}

export function trackBenefitClicked(props: {
  benefit_slug: string
  benefit_category: string
}) {
  amplitude.track('benefit_clicked', props)
}
