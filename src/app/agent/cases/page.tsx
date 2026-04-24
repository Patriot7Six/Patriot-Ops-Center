'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'
import type { ReferralCase } from '@/types/database'

type EnrichedCase = ReferralCase & { match_score?: number; match_reasons?: string[] }

export default function AgentCasesPage() {
  const params = useSearchParams()
  const scope = (params.get('scope') ?? 'open') as 'open' | 'mine'
  const [cases, setCases] = useState<EnrichedCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/agent/cases?scope=${scope}`)
      .then(r => r.json())
      .then(json => setCases(json.cases ?? []))
      .finally(() => setLoading(false))
  }, [scope])

  return (
    <main className="min-h-screen bg-navy-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-white">
            {scope === 'open' ? 'Open cases' : 'Your cases'}
          </h1>
          <div className="inline-flex gap-1 p-1 rounded-full border border-white/10 bg-white/[0.02]">
            <Link
              href="/agent/cases?scope=open"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                scope === 'open' ? 'bg-white text-navy-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Open
            </Link>
            <Link
              href="/agent/cases?scope=mine"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                scope === 'mine' ? 'bg-white text-navy-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mine
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : cases.length === 0 ? (
          <p className="text-center text-slate-500 py-16">
            {scope === 'open' ? 'No open cases in your practice states right now.' : 'No active cases.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {cases.map(c => (
              <li key={c.id}>
                <Link
                  href={`/agent/cases/${c.id}`}
                  className="block p-5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white line-clamp-2 mb-1">
                        {c.condition_summary}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{c.state}</span>
                        {c.urgency === 'urgent' && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400 font-semibold">URGENT</span>
                          </>
                        )}
                        <span>·</span>
                        <span>Submitted {new Date(c.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {typeof c.strength_score === 'number' && (
                        <p className="text-xs text-slate-500 mb-1">Strength</p>
                      )}
                      {typeof c.strength_score === 'number' && (
                        <p className="text-xl font-extrabold text-gold-400">{c.strength_score}</p>
                      )}
                    </div>
                  </div>
                  {c.specialty_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.specialty_tags.map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
