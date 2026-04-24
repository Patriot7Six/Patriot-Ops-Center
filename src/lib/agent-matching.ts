// src/lib/agent-matching.ts
// Scoring logic for matching referral cases to candidate agents. Kept pure
// and framework-agnostic so we can unit-test it without hitting Supabase.
//
// v1 is intentionally simple:
//   • state match is required (RLS enforces this at query time, but we also
//     score it defensively here so misconfigured agents don't slip through)
//   • specialty overlap adds weighted points
//   • capacity (open_case_count < max_concurrent_cases) is a hard gate
//   • accepting_cases=false is a hard gate
//
// Sprint 10+ may layer in: historical win rate, avg turnaround time, and an
// AI screening score. Keep the shape forward-compatible.

import type { Agent, ReferralCase } from '@/types/database'

export interface MatchCandidate {
  agent: Agent
  open_case_count: number
}

export interface MatchScore {
  agent_id: string
  score: number                // 0–100
  reasons: string[]            // human-readable explanations
  eligible: boolean            // false if a hard gate blocks this agent
}

const SPECIALTY_WEIGHT = 15  // per overlapping specialty tag, cap at +60
const SPECIALTY_CAP = 60
const STATE_MATCH_POINTS = 30
const BASE_SCORE = 10

export function scoreAgentForCase(
  candidate: MatchCandidate,
  kase: ReferralCase,
): MatchScore {
  const { agent, open_case_count } = candidate
  const reasons: string[] = []
  let score = BASE_SCORE

  // Hard gates first
  if (agent.status !== 'verified') {
    return {
      agent_id: agent.id,
      score: 0,
      reasons: ['agent is not verified'],
      eligible: false,
    }
  }

  if (!agent.accepting_cases) {
    return {
      agent_id: agent.id,
      score: 0,
      reasons: ['agent is not currently accepting cases'],
      eligible: false,
    }
  }

  if (open_case_count >= agent.max_concurrent_cases) {
    return {
      agent_id: agent.id,
      score: 0,
      reasons: [`at capacity (${open_case_count}/${agent.max_concurrent_cases})`],
      eligible: false,
    }
  }

  if (!agent.practice_states.includes(kase.state)) {
    return {
      agent_id: agent.id,
      score: 0,
      reasons: [`does not practice in ${kase.state}`],
      eligible: false,
    }
  }

  // Soft scoring
  score += STATE_MATCH_POINTS
  reasons.push(`practices in ${kase.state}`)

  const overlapping = kase.specialty_tags.filter(t => agent.specialties.includes(t))
  if (overlapping.length > 0) {
    const bonus = Math.min(SPECIALTY_CAP, overlapping.length * SPECIALTY_WEIGHT)
    score += bonus
    reasons.push(`specialty match: ${overlapping.join(', ')} (+${bonus})`)
  }

  return {
    agent_id: agent.id,
    score: Math.min(100, score),
    reasons,
    eligible: true,
  }
}

/**
 * Rank a set of candidate agents for a given case. Returns eligible agents
 * sorted by score descending.
 */
export function rankAgentsForCase(
  candidates: MatchCandidate[],
  kase: ReferralCase,
): MatchScore[] {
  return candidates
    .map(c => scoreAgentForCase(c, kase))
    .filter(m => m.eligible)
    .sort((a, b) => b.score - a.score)
}
