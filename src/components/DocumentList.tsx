'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'

interface Document {
  id: string
  name: string
  storage_path: string
  mime_type: string
  size_bytes: number
  status: string
  ai_summary: string | null
  created_at: string
}

interface Props {
  documents: Document[]
  onDelete: (id: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.includes('word')) return '📝'
  return '📎'
}

export function DocumentList({ documents, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 border border-white/[0.06] rounded-2xl bg-white/[0.01]">
        <p className="text-slate-500 text-sm">No documents yet</p>
        <p className="text-slate-600 text-xs mt-1">Upload your DD-214 or medical records above</p>
      </div>
    )
  }

  async function handleDownload(doc: Document) {
    setDownloadingId(doc.id)
    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 60)

      if (data?.signedUrl) {
        const a = document.createElement('a')
        a.href = data.signedUrl
        a.download = doc.name
        a.click()
      }
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
        Your Documents ({documents.length})
      </h3>
      <div className="space-y-3">
        {documents.map(doc => (
          <div
            key={doc.id}
            className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4 hover:bg-white/[0.05] transition-colors"
          >
            <span className="text-2xl shrink-0">{getFileIcon(doc.mime_type)}</span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{doc.name}</p>
              <p className="text-xs text-slate-500">
                {formatBytes(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
              {doc.ai_summary && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{doc.ai_summary}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDownload(doc)}
                disabled={downloadingId === doc.id}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Download"
              >
                {downloadingId === doc.id
                  ? <Spinner size="sm" />
                  : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
              </button>
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deletingId === doc.id
                  ? <Spinner size="sm" />
                  : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
