// trigger/jobs/documents.ts
import { task } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Document AI analysis — runs in background after upload ───────────────────
// Identifies the document type, extracts key information, and generates
// a plain-English summary stored back on the documents record.
export const analyzeDocumentJob = task({
  id: 'analyze-document',
  // Allow up to 5 minutes for large documents
  machine: { preset: 'small-1x' },
  run: async (payload: {
    documentId: string
    storagePath: string
    mimeType: string
    documentName: string
    userId: string
  }) => {
    // Mark document as analyzing
    await supabase
      .from('documents')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', payload.documentId)

    try {
      // Download the file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(payload.storagePath)

      if (downloadError || !fileData) throw new Error('Failed to download document')

      // For PDFs and images, send to Claude vision
      // For text files, read directly
      let analysisContent: Anthropic.MessageParam['content']

      if (payload.mimeType === 'application/pdf' || payload.mimeType.startsWith('image/')) {
        const buffer = await fileData.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const mediaType = payload.mimeType as 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'

        analysisContent = [
          {
            type: payload.mimeType === 'application/pdf' ? 'document' : 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          } as Anthropic.ContentBlockParam,
          {
            type: 'text',
            text: 'Analyze this veteran document. Identify: 1) Document type (DD-214, medical record, VA letter, nexus letter, etc.), 2) Key information relevant to VA benefits or claims (service dates, discharge type, disability ratings, diagnoses), 3) A brief plain-English summary (2-3 sentences) of what this document contains and why it matters for a VA claim or benefit. Be specific but concise.',
          },
        ]
      } else {
        // Plain text / Word doc — read as text
        const text = await fileData.text()
        analysisContent = `Analyze this veteran document text and identify: 1) Document type, 2) Key information relevant to VA benefits, 3) A 2-3 sentence summary.\n\n${text.slice(0, 8000)}`
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: analysisContent }],
      })

      const summary = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as Anthropic.TextBlock).text)
        .join('')

      // Auto-tag based on document name and summary
      const tags: string[] = []
      const lower = (payload.documentName + summary).toLowerCase()
      if (lower.includes('dd-214') || lower.includes('dd214'))       tags.push('DD-214')
      if (lower.includes('medical') || lower.includes('diagnosis'))   tags.push('medical')
      if (lower.includes('nexus'))                                     tags.push('nexus-letter')
      if (lower.includes('buddy') || lower.includes('lay statement')) tags.push('buddy-statement')
      if (lower.includes('va letter') || lower.includes('decision'))  tags.push('va-correspondence')
      if (lower.includes('discharge'))                                 tags.push('discharge')

      // Save the analysis
      await supabase
        .from('documents')
        .update({
          status: 'analyzed',
          ai_summary: summary,
          tags: tags.length > 0 ? tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.documentId)

      return { analyzed: true, documentId: payload.documentId, tags }
    } catch (err) {
      console.error('Document analysis failed:', err)

      // Mark as error so the UI can show a retry option
      await supabase
        .from('documents')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('id', payload.documentId)

      throw err
    }
  },
})
