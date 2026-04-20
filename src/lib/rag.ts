import type { SupabaseClient } from '@supabase/supabase-js'
import { generateEmbedding } from './embeddings'

interface KnowledgeChunk {
  content: string
  source: string
  category: string
  similarity: number
}

// Returns top-k VA knowledge chunks as a formatted string ready to inject
// into a Claude system prompt. Returns empty string if RAG is unavailable
// so the caller can proceed without it (graceful degradation).
export async function getRAGContext(
  supabase: SupabaseClient,
  query: string,
  options?: { limit?: number; category?: string },
): Promise<string> {
  try {
    const embedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('search_va_knowledge', {
      query_embedding: embedding,
      match_count: options?.limit ?? 5,
      filter_category: options?.category ?? null,
    })

    if (error || !data?.length) return ''

    const chunks = data as KnowledgeChunk[]
    const context = chunks
      .map(c => `[${c.source}]\n${c.content}`)
      .join('\n\n---\n\n')

    return `## Verified Current VA Information\nThe following data was retrieved from our knowledge base and is current. Prioritize this over your training data for any rates, deadlines, or policy details.\n\n${context}`
  } catch {
    // RAG failure must never block the AI response
    return ''
  }
}
