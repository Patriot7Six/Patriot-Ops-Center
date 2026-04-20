// src/app/api/ai/career/route.ts — replaces sprint5 version
import { getAnthropic, MODEL, SYSTEM_BASE, streamText } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import type { SubscriptionTier } from '@/types/database'

const SYSTEM_MOS = `${SYSTEM_BASE}

You are helping a veteran translate their MOS (Military Occupational Specialty), Rate, or AFSC into civilian career paths.

When given a military role:
1. List 5–8 directly transferable civilian job titles with brief descriptions
2. Highlight which skills from that MOS are most valued by civilian employers
3. Note certifications that would strengthen their candidacy (e.g., PMP, AWS, CISSP)
4. Identify 2–3 industries where this background is especially valued
5. Give an honest realistic salary range for entry-level to experienced civilian roles
6. Mention any veteran preference programs relevant to that career field

Be specific. "Project Manager" is not specific enough — say "Junior Project Manager in IT/Government Contracting."
Format output with clear sections and bullet points.`

const SYSTEM_RESUME = `${SYSTEM_BASE}

You are a resume coach specializing in military-to-civilian resume translation.

When analyzing a resume or resume description:
1. Identify military jargon that civilian hiring managers won't understand — suggest plain-English replacements
2. Flag accomplishments that need quantification (add specific numbers/percentages)
3. Highlight the strongest transferable skills that should be featured more prominently
4. Note any gaps or weaknesses that should be addressed
5. Suggest a civilian summary/objective paragraph tailored to their target role
6. Recommend a clear format: reverse-chronological, skills-based, or hybrid

Be direct and constructive. Give specific rewrites, not vague suggestions.`

const SYSTEM_CAREER_CHAT = `${SYSTEM_BASE}

You are a career transition coach for veterans. Your focus is practical, actionable guidance on:
- Networking strategies in civilian environments
- Interview preparation for veterans
- Federal vs private sector trade-offs
- Using LinkedIn effectively as a veteran
- Leveraging veteran hiring preferences (Schedule A, VOW Act, VetSuccess)
- Education decisions: GI Bill, certifications vs degrees
- Handling gaps, OTH discharges, or complications in job search

Give honest, specific advice. Veterans appreciate directness.`

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

    // Career toolkit is Pro/Elite only — check feature access
    if (tier === 'free') {
      return new Response(
        JSON.stringify({ error: 'Upgrade required', message: 'Career Toolkit requires Ranger or higher.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const rateResult = await checkRateLimit(user.id, tier)
    const headers = rateLimitHeaders(rateResult)

    if (!rateResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Daily limit reached. Resets at ${new Date(rateResult.reset).toLocaleTimeString()}.`,
          reset: rateResult.reset,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...headers } },
      )
    }

    const { messages, mode } = await req.json()

    const system =
      mode === 'mos'    ? SYSTEM_MOS :
      mode === 'resume' ? SYSTEM_RESUME :
      SYSTEM_CAREER_CHAT

    const stream = await getAnthropic().messages.stream({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages,
    })

    return new Response(streamText(stream), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...headers },
    })
  } catch (err) {
    console.error('Career route error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
