// src/lib/referral-cases.ts
// Centralized state-machine + event-logging helpers for referral cases.
// Every status transition goes through these functions so we never diverge
// between API routes and background jobs.
//
// The goal: the only place that mutates referral_cases.status is this file.
// API routes call helpers; helpers do the DB write + append a case_events row
// in the same request flow.

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CaseEventType,
  CaseStatus,
  ReferralCase,
} from '@/types/database'

// Legal state transitions. Anything not in this table is rejected.
const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  submitted: ['open', 'withdrawn', 'expired'],
  open:      ['accepted', 'withdrawn', 'expired'],
  accepted:  ['won', 'lost', 'withdrawn'],
  won:       [],        // terminal
  lost:      [],        // terminal
  withdrawn: [],        // terminal
  expired:   [],        // terminal
}

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export interface LogEventArgs {
  caseId:       string
  eventType:    CaseEventType
  actorUserId:  string | null
  actorRole:    'veteran' | 'agent' | 'system' | 'admin'
  payload?:     Record<string, unknown>
}

export async function logCaseEvent(
  supabase: SupabaseClient,
  args: LogEventArgs,
): Promise<void> {
  const { error } = await supabase.from('case_events').insert({
    case_id:       args.caseId,
    event_type:    args.eventType,
    actor_user_id: args.actorUserId,
    actor_role:    args.actorRole,
    payload:       args.payload ?? {},
  })
  if (error) {
    // Event log failures are logged but never fatal — we don't want a
    // broken audit table to block a legitimate state transition.
    console.error('[case_events] insert failed:', error, args)
  }
}

/**
 * Transition a case to a new status, verifying the move is legal, updating
 * the appropriate lifecycle timestamp, and writing a case_events row.
 *
 * Must be called with a service-role or RLS-bypassing client — the RLS
 * policies on referral_cases intentionally do not allow agents or veterans
 * to update status directly.
 */
export async function transitionCase(
  supabase: SupabaseClient,
  caseId: string,
  to: CaseStatus,
  actor: { userId: string | null; role: 'veteran' | 'agent' | 'system' | 'admin' },
  extra?: {
    agent_id?: string
    outcome_backpay_cents?: number
    outcome_notes?: string
    strength_score?: number
    eventPayload?: Record<string, unknown>
  },
): Promise<{ ok: true; case: ReferralCase } | { ok: false; error: string }> {
  // Read current state
  const { data: current, error: readErr } = await supabase
    .from('referral_cases')
    .select('*')
    .eq('id', caseId)
    .maybeSingle()

  if (readErr || !current) {
    return { ok: false, error: readErr?.message ?? 'Case not found' }
  }

  const kase = current as ReferralCase

  if (!canTransition(kase.status, to)) {
    return {
      ok: false,
      error: `Illegal transition: ${kase.status} → ${to}`,
    }
  }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = {
    status:     to,
    updated_at: now,
  }

  // Lifecycle timestamp bookkeeping
  if (to === 'open')       update.opened_at       = now
  if (to === 'accepted')   update.accepted_at     = now
  if (to === 'won' || to === 'lost') {
    update.outcome_decided_at = now
  }

  if (extra?.agent_id)            update.agent_id              = extra.agent_id
  if (extra?.outcome_backpay_cents !== undefined) {
    update.outcome_backpay_cents = extra.outcome_backpay_cents
  }
  if (extra?.outcome_notes)       update.outcome_notes         = extra.outcome_notes
  if (extra?.strength_score !== undefined) {
    update.strength_score = extra.strength_score
  }

  const { data: updated, error: updateErr } = await supabase
    .from('referral_cases')
    .update(update)
    .eq('id', caseId)
    .select()
    .single()

  if (updateErr || !updated) {
    return { ok: false, error: updateErr?.message ?? 'Update failed' }
  }

  // Event type derived from target status
  const eventType: CaseEventType =
    to === 'open'      ? 'screened' :
    to === 'accepted'  ? 'accepted' :
    to === 'won'       ? 'outcome_won' :
    to === 'lost'      ? 'outcome_lost' :
    to === 'withdrawn' ? 'withdrawn' :
    to === 'expired'   ? 'expired' :
    'note'

  await logCaseEvent(supabase, {
    caseId,
    eventType,
    actorUserId: actor.userId,
    actorRole:   actor.role,
    payload:     { from: kase.status, to, ...extra?.eventPayload },
  })

  return { ok: true, case: updated as ReferralCase }
}
