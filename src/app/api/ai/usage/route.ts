import { peekAiRateLimit, rateLimitHeaders, type AnonTool } from '@/lib/ratelimit'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const toolParam = url.searchParams.get('tool')
  const tool = toolParam === 'eligibility' || toolParam === 'claims'
    ? (toolParam as AnonTool)
    : undefined

  const rl = await peekAiRateLimit(req, tool)
  return Response.json(
    { limit: rl.limit, remaining: rl.remaining, reset: rl.reset },
    { headers: rateLimitHeaders(rl) },
  )
}
