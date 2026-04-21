// src/app/api/ai/eligibility/route.ts — replaces sprint2 version
import { getAnthropic, MODEL, SYSTEM_BASE, streamText } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, checkAnonRateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import { getRAGContext } from '@/lib/rag'
import type { SubscriptionTier } from '@/types/database'


const SYSTEM = `${SYSTEM_BASE}

You are currently in the VA Eligibility Checker. Your job is to analyze the veteran's service history and identify every benefit they likely qualify for.

When analyzing eligibility:
1. Ask clarifying questions if the veteran's service details are incomplete (branch, years served, discharge type, any disabilities)
2. List benefits by category: Disability, Education, Housing, Healthcare, Career
3. For each benefit, state: what it is, why they likely qualify, and the next step to apply
4. Be honest about uncertain eligibility — explain what additional information is needed
5. Always mention VSO (Veterans Service Organization) assistance as a free resource
6. End every analysis with the top 3 "quick wins" — benefits with the highest value and easiest path to approval`

export async function POST(req: Request) {
  try {
    // Detect auth state — public users get IP-based rate limiting,
    // authenticated users get their tier's limit.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let rateResult: Awaited<ReturnType<typeof checkRateLimit>>
    let tier: SubscriptionTier | 'anon'

    if (user) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', user.id)
        .single()

      const isActive = ['active', 'trialing'].includes(subscription?.status ?? '')
      tier = (isActive ? subscription?.tier : 'free') as SubscriptionTier ?? 'free'
      rateResult = await checkRateLimit(user.id, tier)
    } else {
      tier = 'anon'
      rateResult = await checkAnonRateLimit(req, 'eligibility')
    }

    const headers = rateLimitHeaders(rateResult)

    if (!rateResult.success) {
      const message = tier === 'anon'
        ? 'You\'ve used your 10 free daily analyses. Sign up for a free account to keep going.'
        : tier === 'free'
          ? 'You\'ve reached your daily limit of 10 AI requests. Upgrade to Ranger for 100/day.'
          : `You've reached your daily limit. Resets at ${new Date(rateResult.reset).toLocaleTimeString()}.`

      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', message, reset: rateResult.reset }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...headers } },
      )
    }

    const { messages } = await req.json()

    // Retrieve relevant VA knowledge chunks based on the user's latest message
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    const ragContext = lastUserMessage
      ? await getRAGContext(supabase, lastUserMessage.content ?? '', { limit: 5 })
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
    console.error('Eligibility route error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
