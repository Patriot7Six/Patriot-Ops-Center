'use client'
import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

const BRANCHES = ['Army', 'Navy', 'Air Force', 'Marine Corps', 'Coast Guard', 'Space Force'] as const

const MOS_LABEL: Record<string, string> = {
  Navy: 'Rate',
  'Coast Guard': 'Rate',
  'Air Force': 'AFSC',
  'Space Force': 'AFSC',
}

const EXAMPLE_MOS: Record<string, string> = {
  Army: '11B — Infantry',
  Navy: '0814 — Fire Control Technician',
  'Air Force': '6F0X1 — Financial Management',
  'Marine Corps': '0311 — Rifleman',
  'Coast Guard': 'BM — Boatswain\'s Mate',
  'Space Force': '5N0X1 — Space Systems Operations',
}

export function MOSMapper() {
  const [branch, setBranch] = useState('')
  const [mos, setMos] = useState('')
  const [result, setResult] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)

  const mosLabel = MOS_LABEL[branch] ?? 'MOS'
  const mosPlaceholder = branch ? `e.g. ${EXAMPLE_MOS[branch]}` : 'Enter your MOS / Rate / AFSC'

  const handleSubmit = useCallback(async () => {
    if (!branch || !mos.trim()) return
    setResult('')
    setError('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/ai/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'mos',
          messages: [{
            role: 'user',
            content: `Branch: ${branch}\n${mosLabel}: ${mos.trim()}\n\nPlease map this military role to civilian career opportunities with full detail.`,
          }],
        }),
      })

      if (!res.ok) throw new Error('Request failed')
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setResult(prev => {
          const updated = prev + decoder.decode(value)
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 0)
          return updated
        })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsStreaming(false)
    }
  }, [branch, mos, mosLabel])

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-white mb-1">Enter Your Military Role</h3>
          <p className="text-xs text-slate-500">
            We'll identify the civilian careers that best match your skills and experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Branch
            </label>
            <select
              value={branch}
              onChange={e => { setBranch(e.target.value); setMos(''); setResult('') }}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 transition-all appearance-none"
            >
              <option value="" className="bg-navy-900">Select branch…</option>
              {BRANCHES.map(b => (
                <option key={b} value={b} className="bg-navy-900">{b}</option>
              ))}
            </select>
          </div>

          {/* MOS */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {mosLabel}
            </label>
            <input
              type="text"
              value={mos}
              onChange={e => setMos(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={mosPlaceholder}
              disabled={!branch}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!branch || !mos.trim() || isStreaming}
          size="md"
        >
          {isStreaming ? (
            <><Spinner size="sm" /> Mapping careers…</>
          ) : (
            'Find Civilian Careers →'
          )}
        </Button>
      </div>

      {/* Results */}
      {(result || isStreaming) && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Career Map</p>
              <p className="text-xs text-slate-500">{branch} · {mosLabel} {mos}</p>
            </div>
          </div>

          {result ? (
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" /> Analyzing your military background…
            </div>
          )}
          <div ref={resultRef} />
        </div>
      )}
    </div>
  )
}
