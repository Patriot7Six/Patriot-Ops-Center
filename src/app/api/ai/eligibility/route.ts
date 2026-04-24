// src/app/api/ai/eligibility/route.ts — replaces sprint2 version
import { getAnthropic, MODEL, SYSTEM_BASE, streamText } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, checkAnonRateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import { getRAGContext } from '@/lib/rag'
import { COMPENSATION_RATES, LOAN_LIMITS, EDUCATION_RATES } from '@/lib/va-rates'
import type { SubscriptionTier } from '@/types/database'


function buildSystemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10)
  const c = COMPENSATION_RATES

  return `${SYSTEM_BASE}

Today's date is ${today}.

You are currently in the VA Eligibility Checker. Your job is to analyze the veteran's service history and identify every benefit they likely qualify for.

## Current rate anchor (always authoritative)
- VA disability compensation: ${c.rate_year} rates effective ${c.effective_date} (${c.cola_pct} COLA).
- VA home loan limits: ${LOAN_LIMITS.year} FHFA conforming limits apply.
- GI Bill academic year: ${EDUCATION_RATES.academic_year}.
- Official compensation rate source: ${c.source_url}

## Strict citation rules — NON-NEGOTIABLE
- Every dollar amount, rating threshold, Priority Group number, form number, deadline, or expiration date you mention MUST come from either (a) the "Verified Current VA Information" block below, or (b) the rate anchor above. Never invent one from memory.
- If a specific figure is not present in either source, say "I don't have that figure in my current data — please check ${c.source_url}" and move on. Do NOT guess or approximate.
- Never cite a rate year earlier than ${c.rate_year}. If you catch yourself reaching for an older rate year from memory, STOP and use the Verified Current VA Information block instead.
- VA Healthcare Priority Groups are counterintuitive: Group 1 is the HIGHEST priority (50%+ service-connected or TDIU). Group 8 is the lowest. A 50%-rated veteran is Priority Group 1, not Group 3. Do not invert this.

## Response structure
1. Ask clarifying questions if the veteran's service details are incomplete (branch, discharge type, dependents, service-connection status).
2. List benefits by category: Disability, Education, Housing, Healthcare, Career.
3. For each benefit, state: what it is, why they likely qualify, and the next step to apply (with the official URL or form number from the Verified Current VA Information block).
4. Be honest about uncertain eligibility — explain what additional information is needed.
5. Always mention VSO (Veterans Service Organization) assistance as a free resource.
6. End every analysis with the top 3 "quick wins" — benefits with the highest value and easiest path to approval.`
}

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
          ? 'You\'ve reached your daily limit of 10 AI requests. Upgrade to Special Ops for 100/day.'
          : `You've reached your daily limit. Resets at ${new Date(rateResult.reset).toLocaleTimeString()}.`

      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', message, reset: rateResult.reset }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...headers } },
      )
    }

    const { messages } = await req.json()

    // Retrieve relevant VA knowledge chunks based on the user's latest message.
    // Eligibility queries span multiple categories (comp, healthcare, education,
    // housing, career) so we pull a wider set than the default narrow-chat routes.
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    const ragContext = lastUserMessage
      ? await getRAGContext(supabase, lastUserMessage.content ?? '', { limit: 12 })
      : ''

    const system = buildSystemPrompt()
    const systemWithRAG = ragContext ? `${system}\n\n${ragContext}` : system

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
