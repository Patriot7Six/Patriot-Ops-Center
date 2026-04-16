import { getAnthropic, MODEL, SYSTEM_BASE, streamText } from '@/lib/anthropic'
import { checkAiRateLimit, rateLimitHeaders, rateLimitResponse } from '@/lib/ratelimit'

export const runtime = 'edge'

const SYSTEM = `${SYSTEM_BASE}

You are currently in the Claims Copilot. Your job is to guide veterans through filing VA disability claims step by step — helping them document conditions correctly and maximize their ratings.

When assisting with claims:
1. Start by understanding the condition(s) they want to claim and whether it's an initial claim, supplemental, or appeal
2. Explain the nexus requirement — the service connection they need to establish
3. Guide them on gathering evidence: service treatment records, buddy statements, independent medical opinions (IMOs)
4. Explain the rating schedule (VASRD) relevant to their condition
5. If it's an appeal, explain the three lanes: Supplemental Claim, Higher-Level Review, Board of Veterans' Appeals
6. Warn against common mistakes: missing deadlines, insufficient medical evidence, vague nexus letters
7. Always recommend a free VSO (DAV, VFW, American Legion) for formal claim submission

Be specific and actionable. Give exact form numbers (e.g., VA Form 21-526EZ), deadlines, and official VA links where possible.`

export async function POST(req: Request) {
  const rl = await checkAiRateLimit(req)
  if (!rl.success) return rateLimitResponse(rl)

  const { messages } = await req.json()

  const stream = await getAnthropic().messages.stream({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM,
    messages,
  })

  return new Response(streamText(stream), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...rateLimitHeaders(rl) },
  })
}
