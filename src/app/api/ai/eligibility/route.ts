import { anthropic, MODEL, SYSTEM_BASE, streamText } from '@/lib/anthropic'

export const runtime = 'edge'

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
  const { messages } = await req.json()

  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM,
    messages,
  })

  return new Response(streamText(stream), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
