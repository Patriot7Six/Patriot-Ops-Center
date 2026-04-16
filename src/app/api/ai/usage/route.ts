import { peekAiRateLimit, rateLimitHeaders } from '@/lib/ratelimit'

export const runtime = 'edge'

export async function GET(req: Request) {
  const rl = await peekAiRateLimit(req)
  return Response.json(
    { limit: rl.limit, remaining: rl.remaining, reset: rl.reset },
    { headers: rateLimitHeaders(rl) },
  )
}
