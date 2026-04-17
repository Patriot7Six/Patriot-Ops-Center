'use client'
import { useState, useRef, useCallback } from 'react'
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
  onUploaded: (doc: Document) => void
}

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx'
const MAX_MB = 20

export function DocumentUploader({ onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB`)
      return
    }

    setIsUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        return
      }

      onUploaded(data.document)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [onUploaded])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-gold-500/60 bg-gold-500/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        } ${isUploading ? 'pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onFileChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-slate-400">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {isDragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF, JPG, PNG, DOCX, TXT · Max {MAX_MB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}

      <p className="mt-3 text-xs text-slate-600 text-center">
        Supported: DD-214, medical records, nexus letters, buddy statements, VA correspondence
      </p>
    </div>
  )
}
