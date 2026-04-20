// src/app/api/ai/claims/route.ts — replaces sprint2 version
import { getAnthropic, MODEL, SYSTEM_BASE, streamText } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import { getRAGContext } from '@/lib/rag'
import type { SubscriptionTier } from '@/types/database'

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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single()

    const isActive = ['active', 'trialing'].includes(subscription?.status ?? '')
    const tier = (isActive ? subscription?.tier : 'free') as SubscriptionTier ?? 'free'

    const rateResult = await checkRateLimit(user.id, tier)
    const headers = rateLimitHeaders(rateResult)

    if (!rateResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: tier === 'free'
            ? 'You\'ve reached your daily limit. Upgrade to Ranger for 100 AI requests/day.'
            : `Daily limit reached. Resets at ${new Date(rateResult.reset).toLocaleTimeString()}.`,
          reset: rateResult.reset,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...headers } },
      )
    }

    const { messages } = await req.json()

    // Retrieve relevant VA knowledge chunks based on the user's latest message
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    const ragContext = lastUserMessage
      ? await getRAGContext(supabase, lastUserMessage.content ?? '', { limit: 5, category: 'claims' })
      : ''

    const systemWithRAG = ragContext ? `${SYSTEM}\n\n${ragContext}` : SYSTEM

    const stream = await getAnthropic().messages.stream({
      model: MODEL,
      max_tokens: 1500,
      system: systemWithRAG,
      messages,
    })

    return new Response(streamText(stream), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...headers },
    })
  } catch (err) {
    console.error('Claims route error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
