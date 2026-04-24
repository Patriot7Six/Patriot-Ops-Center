// src/lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/types/database'

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ── Rate limit tiers ──────────────────────────────────────────────────────────
// Free users:  10 AI requests / 24 hours
// Elite users: 500 AI requests / 24 hours
//
// These are per-user limits keyed on their Supabase user ID.
// The window is a sliding window — not reset at midnight.

export const AI_LIMITS: Record<SubscriptionTier, number> = {
  free: 10,
  elite: 500,
}

export const ANON_AI_LIMIT = 10

export type AnonTool = 'eligibility' | 'claims'

const limiters: Record<SubscriptionTier, Ratelimit> = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AI_LIMITS.free, '24 h'),
    prefix: 'ratelimit:free',
    analytics: true,
  }),
  elite: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AI_LIMITS.elite, '24 h'),
    prefix: 'ratelimit:elite',
    analytics: true,
  }),
}

const anonLimiters: Record<AnonTool, Ratelimit> = {
  eligibility: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(ANON_AI_LIMIT, '24 h'),
    prefix: 'ratelimit:anon:eligibility',
    analytics: true,
  }),
  claims: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(ANON_AI_LIMIT, '24 h'),
    prefix: 'ratelimit:anon:claims',
    analytics: true,
  }),
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')
    ?? req.headers.get('cf-connecting-ip')
    ?? 'unknown'
}

export async function checkAnonRateLimit(req: Request, tool: AnonTool) {
  const ip = getClientIp(req)
  return anonLimiters[tool].limit(ip)
}

export async function peekAnonRateLimit(req: Request, tool: AnonTool) {
  const ip = getClientIp(req)
  const { remaining, reset } = await anonLimiters[tool].getRemaining(ip)
  return { success: remaining > 0, limit: ANON_AI_LIMIT, remaining, reset }
}

/**
 * Check whether a user is within their rate limit.
 * Returns the Upstash result with `success`, `limit`, `remaining`, and `reset`.
 *
 * Usage in an API route:
 * ```ts
 * const result = await checkRateLimit(userId, userTier)
 * if (!result.success) {
 *   return new Response('Rate limit exceeded', {
 *     status: 429,
 *     headers: {
 *       'X-RateLimit-Limit':     String(result.limit),
 *       'X-RateLimit-Remaining': String(result.remaining),
 *       'X-RateLimit-Reset':     String(result.reset),
 *       'Retry-After':           String(Math.ceil((result.reset - Date.now()) / 1000)),
 *     },
 *   })
 * }
 * ```
 */
export async function checkRateLimit(userId: string, tier: SubscriptionTier = 'free') {
  const limiter = limiters[tier] ?? limiters.free
  return limiter.limit(userId)
}

/**
 * Returns rate limit headers to attach to API responses.
 * Helps clients know how many requests they have left.
 */
export function rateLimitHeaders(result: { limit: number; remaining: number; reset: number }) {
  return {
    'X-RateLimit-Limit':     String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset':     new Date(result.reset).toUTCString(),
  }
}

/**
 * Peek at the caller's AI rate limit without consuming a request.
 * - Authenticated: returns the tier-based shared limit.
 * - Anonymous: returns the IP-based per-tool limit (requires `tool`).
 * Used by the /api/ai/usage endpoint to show current quota in the UI.
 */
export async function peekAiRateLimit(req?: Request, tool?: AnonTool) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (req && tool) return peekAnonRateLimit(req, tool)
    return { success: false, limit: ANON_AI_LIMIT, remaining: ANON_AI_LIMIT, reset: Date.now() }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .single()

  const isActive = ['active', 'trialing'].includes(subscription?.status ?? '')
  const tier = ((isActive ? subscription?.tier : 'free') as SubscriptionTier) ?? 'free'

  const limiter = limiters[tier] ?? limiters.free
  const { remaining, reset } = await limiter.getRemaining(user.id)
  const limit = AI_LIMITS[tier]

  return { success: remaining > 0, limit, remaining, reset }
}
