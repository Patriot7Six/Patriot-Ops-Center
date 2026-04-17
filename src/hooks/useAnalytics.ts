'use client'
// src/hooks/useAnalytics.ts
// Lightweight wrapper so components never import amplitude directly.
// All event functions are re-exported here for a single import point.

export {
  trackSignupCompleted,
  trackLoginCompleted,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
  trackSubscriptionUpgraded,
  trackSubscriptionCanceled,
  trackFeatureGateHit,
  trackAIQuerySent,
  trackDocumentUploaded,
  trackDocumentDeleted,
  trackCareerTabViewed,
  trackBillingPageViewed,
  trackCheckoutStarted,
  trackBenefitClicked,
  identifyUser,
  resetUser,
} from '@/lib/amplitude'

// Usage example:
//
// import { trackAIQuerySent } from '@/hooks/useAnalytics'
//
// // Inside an event handler or useEffect:
// trackAIQuerySent({ feature: 'va_eligibility', is_followup: false })
