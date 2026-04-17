'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

const PLACEHOLDER = `Paste your resume here, or describe your military background and the civilian job you're targeting.

Example:
"I served 8 years as an Army 25U (Signal Support Specialist), reaching E-6. I managed a 12-person comms team, maintained SINCGARS and SATCOM equipment, and trained 40+ soldiers on network operations. Now looking for IT support or network engineering roles in the private sector."`

const TIPS = [
  'Include your MOS/Rate, years served, and highest rank',
  'List specific systems, equipment, or software you used',
  'Mention the size of teams you led or supported',
  'Note any certifications (CompTIA, AWS, PMP, etc.)',
  'State your target civilian role if you know it',
]

export function ResumeAnalyzer() {
  const [resume, setResume] = useState('')
  const [result, setResult] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [showTips, setShowTips] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  async function handleAnalyze() {
    if (!resume.trim() || isStreaming) return
    setResult('')
    setError('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/ai/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'resume',
          messages: [{ role: 'user', content: resume.trim() }],
        }),
      })

      if (!res.ok) throw new Error('Request failed')
      if (!res.body) throw new Error('No body')

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
  }

  function handleClear() {
    setResume('')
    setResult('')
    setError('')
  }

  const charCount = resume.length
  const wordCount = resume.trim() ? resume.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white mb-1">Paste Your Resume</h3>
            <p className="text-xs text-slate-500">
              AI will identify military jargon, missing metrics, and specific improvements to strengthen your civilian application.
            </p>
          </div>
          <button
            onClick={() => setShowTips(v => !v)}
            className="shrink-0 text-xs text-gold-500 hover:text-gold-400 font-medium transition-colors"
          >
            {showTips ? 'Hide tips' : 'Tips for best results'}
          </button>
        </div>

        {/* Tips */}
        {showTips && (
          <div className="bg-gold-500/5 border border-gold-500/20 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-gold-400 mb-2">For the most useful analysis, include:</p>
            <ul className="space-y-1">
              {TIPS.map(tip => (
                <li key={tip} className="text-xs text-slate-400 flex items-start gap-2">
                  <svg className="w-3 h-3 text-gold-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 14l-4.121-4.121a1 1 0 111.414-1.414L8.414 11.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="relative">
          <textarea
            value={resume}
            onChange={e => setResume(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={10}
            disabled={isStreaming}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-700 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 transition-all resize-none disabled:opacity-50"
          />
          {resume && (
            <p className="absolute bottom-3 right-3 text-xs text-slate-700">
              {wordCount} words
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={!resume.trim() || isStreaming}
            size="md"
          >
            {isStreaming ? (
              <><Spinner size="sm" /> Analyzing…</>
            ) : (
              'Analyze Resume →'
            )}
          </Button>
          {(resume || result) && !isStreaming && (
            <Button variant="ghost" size="md" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {(result || isStreaming) && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">Resume Analysis</p>
          </div>

          {result ? (
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" /> Reading your resume…
            </div>
          )}
          <div ref={resultRef} />
        </div>
      )}
    </div>
  )
}
