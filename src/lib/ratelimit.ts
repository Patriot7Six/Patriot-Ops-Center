import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ANON_DAILY_LIMIT = 10

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const limiter = hasRedis
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(ANON_DAILY_LIMIT, '1 d'),
      analytics: true,
      prefix: 'ratelimit:ai',
    })
  : null

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

function identify(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'
  )
}

export async function checkAiRateLimit(req: Request): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: ANON_DAILY_LIMIT, remaining: ANON_DAILY_LIMIT, reset: 0 }
  }
  return limiter.limit(identify(req))
}

export async function peekAiRateLimit(req: Request): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: ANON_DAILY_LIMIT, remaining: ANON_DAILY_LIMIT, reset: 0 }
  }
  const { remaining, reset } = await limiter.getRemaining(identify(req))
  return { success: remaining > 0, limit: ANON_DAILY_LIMIT, remaining, reset }
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  }
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    `You've reached the free daily limit of ${result.limit} analyses. Sign up for a free account to continue.`,
    {
      status: 429,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...rateLimitHeaders(result),
        'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
      },
    },
  )
}
