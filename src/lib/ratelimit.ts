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
// Free users: 10 AI requests / 24 hours
// Pro users:  100 AI requests / 24 hours
// Elite users: 500 AI requests / 24 hours
//
// These are per-user limits keyed on their Supabase user ID.
// The window is a sliding window — not reset at midnight.

export const AI_LIMITS: Record<SubscriptionTier, number> = {
  free: 10,
  pro: 100,
  elite: 500,
}

const limiters: Record<SubscriptionTier, Ratelimit> = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AI_LIMITS.free, '24 h'),
    prefix: 'ratelimit:free',
    analytics: true,
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AI_LIMITS.pro, '24 h'),
    prefix: 'ratelimit:pro',
    analytics: true,
  }),
  elite: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AI_LIMITS.elite, '24 h'),
    prefix: 'ratelimit:elite',
    analytics: true,
  }),
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
 * Peek at the authenticated user's AI rate limit without consuming a request.
 * Used by the /api/ai/usage endpoint to show current quota in the UI.
 */
export async function peekAiRateLimit() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, limit: AI_LIMITS.free, remaining: 0, reset: Date.now() }
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
