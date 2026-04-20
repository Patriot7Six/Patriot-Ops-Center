// Voyage AI embedding — works on both Next.js Edge and Node.js runtimes.
// Model: voyage-3 (1024 dimensions), recommended by Anthropic for Claude RAG.
// Docs: https://docs.voyageai.com/reference/embeddings-api

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'

function getVoyageKey(): string {
  const key = process.env.VOYAGE_API_KEY
  if (!key) throw new Error('VOYAGE_API_KEY is not set')
  return key
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getVoyageKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: [text] }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage AI embedding failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  return json.data[0].embedding as number[]
}

// Batch embedding — more efficient for sync jobs (up to 128 texts per request)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getVoyageKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: texts }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage AI batch embedding failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  return (json.data as { index: number; embedding: number[] }[])
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding)
}
