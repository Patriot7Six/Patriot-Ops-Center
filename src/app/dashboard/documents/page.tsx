'use client'
import { useEffect, useState } from 'react'
import { FeatureGate } from '@/components/FeatureGate'
import { DocumentUploader } from '@/components/DocumentUploader'
import { DocumentList } from '@/components/DocumentList'
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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function loadDocuments() {
    const res = await fetch('/api/documents')
    if (res.ok) {
      const { documents } = await res.json()
      setDocuments(documents)
    }
    setIsLoading(false)
  }

  useEffect(() => { loadDocuments() }, [])

  function handleUploaded(doc: Document) {
    setDocuments(prev => [doc, ...prev])
  }

  async function handleDelete(id: string) {
    const res = await fetch('/api/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setDocuments(prev => prev.filter(d => d.id !== id))
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-16 border-b border-white/[0.06] px-6 lg:px-8 flex items-center shrink-0">
        <div>
          <h1 className="text-white font-semibold">Documents</h1>
          <p className="text-xs text-slate-500">Store and analyze your DD-214, medical records, and supporting files</p>
        </div>
      </header>

      <div className="p-6 lg:p-8 space-y-8 max-w-4xl">
        <FeatureGate feature="document_upload">
          <div className="space-y-6">
            <DocumentUploader onUploaded={handleUploaded} />

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <DocumentList documents={documents} onDelete={handleDelete} />
            )}
          </div>
        </FeatureGate>
      </div>
    </div>
  )
}
