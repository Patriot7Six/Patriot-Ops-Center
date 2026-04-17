// src/app/api/ai/documents/route.ts — streaming ad-hoc Q&A on an uploaded document
import { getAnthropic, MODEL, SYSTEM_BASE, streamText } from '@/lib/anthropic'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import type { SubscriptionTier } from '@/types/database'
import type Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

const SYSTEM = `${SYSTEM_BASE}

You are analyzing a veteran document the user has uploaded (DD-214, medical records, VA letters, nexus letters, buddy statements, etc.).

When answering questions about the document:
1. Reference specific content from the document when citing facts — quote exact phrases when they matter.
2. Explain what the document means for the veteran's VA benefits or claim in plain English.
3. If the document has a disability rating, nexus, or diagnosis, call out the VA-benefit implications.
4. Point out any missing evidence, unclear language, or weaknesses a claims reviewer might flag.
5. Be direct: if the document helps the claim, say so; if it hurts, say that too.
6. Always recommend a free VSO (DAV, VFW, American Legion) for formal claim work.`

type SupportedMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'text/plain'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

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
    const tier = ((isActive ? subscription?.tier : 'free') as SubscriptionTier) ?? 'free'

    // Document analysis is Pro/Elite only
    if (tier === 'free') {
      return new Response(
        JSON.stringify({
          error: 'Upgrade required',
          message: 'Document analysis requires Ranger or higher.',
        }),
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

    const { documentId, messages } = (await req.json()) as {
      documentId: string
      messages: Anthropic.MessageParam[]
    }

    if (!documentId || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'documentId and messages required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verify ownership and load metadata
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, storage_path, mime_type, name, ai_summary')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docErr || !doc) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Pull the file bytes with a service-role client so RLS on storage doesn't block us
    const service = await createServiceClient()
    const { data: file, error: dlErr } = await service.storage
      .from('documents')
      .download(doc.storage_path)

    if (dlErr || !file) {
      return new Response(
        JSON.stringify({ error: 'Failed to load document' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Build the document context block for Claude
    const mime = doc.mime_type as SupportedMimeType
    let documentBlock: Anthropic.ContentBlockParam[]

    if (mime === 'application/pdf' || mime.startsWith('image/')) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      documentBlock = [
        {
          type: mime === 'application/pdf' ? 'document' : 'image',
          source: { type: 'base64', media_type: mime, data: base64 },
        } as Anthropic.ContentBlockParam,
        {
          type: 'text',
          text: `Document name: ${doc.name}${
            doc.ai_summary ? `\n\nPrior AI summary of this document:\n${doc.ai_summary}` : ''
          }`,
        },
      ]
    } else {
      // Treat text/word as plain text — truncate to avoid token blowout
      const text = await file.text()
      documentBlock = [
        {
          type: 'text',
          text: `Document name: ${doc.name}${
            doc.ai_summary ? `\n\nPrior AI summary:\n${doc.ai_summary}` : ''
          }\n\nDocument contents:\n${text.slice(0, 12000)}`,
        },
      ]
    }

    // Prepend the document to the user's first message so Claude sees the doc
    // on every turn without us re-uploading it.
    const firstUserIdx = messages.findIndex(m => m.role === 'user')
    const augmented: Anthropic.MessageParam[] = messages.map((m, i) => {
      if (i !== firstUserIdx) return m
      const existing = typeof m.content === 'string'
        ? [{ type: 'text' as const, text: m.content }]
        : m.content
      return { role: 'user', content: [...documentBlock, ...existing] }
    })

    const stream = await getAnthropic().messages.stream({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: augmented,
    })

    return new Response(streamText(stream), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...headers },
    })
  } catch (err) {
    console.error('Documents AI route error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
