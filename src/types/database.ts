// Sprint 9 extends Sprint 8's database types. Keep all Sprint 8 types intact
// and append the new agent/referral shapes below.

export type SubscriptionTier = 'free' | 'elite'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
export type BillingInterval = 'monthly' | 'yearly'

export interface Profile {
  id: string
  full_name: string | null
  branch: string | null
  rank: string | null
  mos: string | null
  ets_date: string | null
  avatar_url: string | null
  onboarded: boolean
  is_agent: boolean       // Sprint 9
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
  billing_interval: BillingInterval | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

// ─── Sprint 9: Agent referrals ───────────────────────────────────────────────

export type AgentRole = 'attorney' | 'claims_agent'
export type AgentStatus = 'pending_verification' | 'verified' | 'suspended' | 'rejected'

export type CaseStatus =
  | 'submitted'
  | 'open'
  | 'accepted'
  | 'won'
  | 'lost'
  | 'withdrawn'
  | 'expired'

export type CaseEventType =
  | 'submitted'
  | 'screened'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'outcome_won'
  | 'outcome_lost'
  | 'note'
  | 'expired'

export interface Agent {
  id: string
  user_id: string
  role: AgentRole
  status: AgentStatus
  full_name: string
  firm_name: string | null
  bar_number: string | null
  bar_state: string | null
  ogc_accreditation_number: string | null
  practice_states: string[]
  specialties: string[]
  bio: string | null
  phone: string | null
  public_email: string | null
  verified_at: string | null
  verification_source: 'ogc_auto' | 'admin_manual' | null
  ogc_last_seen_at: string | null
  admin_notes: string | null
  max_concurrent_cases: number
  accepting_cases: boolean
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface OGCAccreditation {
  id: number
  accreditation_number: string | null
  role: AgentRole
  first_name: string
  last_name: string
  city: string | null
  state: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  organization: string | null
  ingested_at: string
  source_file: string | null
  created_at: string
}

export interface ReferralCase {
  id: string
  veteran_user_id: string
  agent_id: string | null
  status: CaseStatus
  condition_summary: string
  denial_summary: string | null
  current_rating: number | null
  requested_rating: number | null
  state: string
  specialty_tags: string[]
  urgency: 'standard' | 'urgent' | null
  denial_letter_path: string | null
  extra_notes: string | null
  strength_score: number | null
  estimated_backpay_cents: number | null
  outcome_decided_at: string | null
  outcome_backpay_cents: number | null
  outcome_notes: string | null
  submitted_at: string
  opened_at: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

export interface CaseEvent {
  id: number
  case_id: string
  event_type: CaseEventType
  actor_user_id: string | null
  actor_role: 'veteran' | 'agent' | 'system' | 'admin'
  payload: Record<string, unknown>
  created_at: string
}
