import { peekAiRateLimit, rateLimitHeaders } from '@/lib/ratelimit'

export async function GET() {
  const rl = await peekAiRateLimit()
  return Response.json(
    { limit: rl.limit, remaining: rl.remaining, reset: rl.reset },
    { headers: rateLimitHeaders(rl) },
  )
}
