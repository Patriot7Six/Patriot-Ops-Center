import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODEL = 'claude-sonnet-4-20250514'

/**
 * Creates a ReadableStream that pipes Claude's streaming text response
 * directly to the browser. Works with Next.js route handlers that return
 * a Response with a ReadableStream body.
 */
export function streamText(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

/** System prompt shared across AI features */
export const SYSTEM_BASE = `You are the Patriot Ops Center AI assistant — an expert on U.S. veteran benefits, VA claims, and military-to-civilian career transitions. You were built to help veterans and their families navigate complex federal benefit systems with clarity and confidence.

Core principles:
- Be direct, practical, and specific. No vague platitudes.
- Use plain English. Avoid acronyms without explaining them first.
- Always cite the official VA or DoD source when referencing specific programs.
- When unsure, say so — do not fabricate benefit names, deadlines, or eligibility rules.
- Encourage veterans to work with a VSO (Veterans Service Organization) for formal claims.
- Format responses with clear sections and bullet points when appropriate.
- Show empathy — you are speaking to people who served and may be frustrated with the system.`
