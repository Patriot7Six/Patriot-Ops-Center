'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import type { CaseStatus, ReferralCase } from '@/types/database'

const STATUS_LABELS: Record<CaseStatus, { label: string; tone: 'slate' | 'gold' | 'green' | 'amber' | 'red' }> = {
  submitted: { label: 'In review',      tone: 'amber' },
  open:      { label: 'Matching',       tone: 'gold' },
  accepted:  { label: 'Agent assigned', tone: 'green' },
  won:       { label: 'Won',            tone: 'green' },
  lost:      { label: 'Closed',         tone: 'slate' },
  withdrawn: { label: 'Withdrawn',      tone: 'slate' },
  expired:   { label: 'Expired',        tone: 'red' },
}

const TONE_CLASSES: Record<string, string> = {
  slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  gold:  'bg-gold-500/10  border-gold-500/30 text-gold-400',
  green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  red:   'bg-red-500/10 border-red-500/30 text-red-400',
}

export default function ReferralsListPage() {
  const [cases, setCases] = useState<ReferralCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referrals/list')
      .then(r => r.json())
      .then(json => setCases(json.cases ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-16 border-b border-white/[0.06] px-6 lg:px-8 flex items-center justify-between shrink-0">
        <h1 className="text-white font-semibold">Agent Referrals</h1>
        <Button variant="primary" size="sm" asChild>
          <Link href="/referral">+ New case</Link>
        </Button>
      </header>

      <div className="p-6 lg:p-8 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="md" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">You haven&apos;t submitted any cases yet.</p>
            <Button variant="primary" size="md" asChild>
              <Link href="/referral">Submit your first case</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {cases.map(c => {
              const tone = STATUS_LABELS[c.status]
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/referrals/${c.id}`}
                    className="block p-5 bg-white/[0.02] border border-white/[0.07] rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="font-semibold text-white line-clamp-1">
                        {c.condition_summary.slice(0, 90)}
                        {c.condition_summary.length > 90 ? '…' : ''}
                      </p>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${TONE_CLASSES[tone.tone]}`}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{c.state}</span>
                      <span>·</span>
                      <span>{new Date(c.submitted_at).toLocaleDateString()}</span>
                      {c.specialty_tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{c.specialty_tags.slice(0, 3).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
