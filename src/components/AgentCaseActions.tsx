'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import type { CaseStatus } from '@/types/database'

interface Props {
  caseId: string
  status: CaseStatus
  isMine: boolean
}

export function AgentCaseActions({ caseId, status, isMine }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showOutcome, setShowOutcome] = useState<false | 'won' | 'lost'>(false)
  const [outcomeBackpay, setOutcomeBackpay] = useState('')
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [showDecline, setShowDecline] = useState(false)

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || json.error || 'Action failed')
    return json
  }

  function handleAccept() {
    setError('')
    startTransition(async () => {
      try {
        await post('/api/agent/accept', { caseId })
        router.refresh()
      } catch (e) { setError((e as Error).message) }
    })
  }

  function handleDecline() {
    setError('')
    startTransition(async () => {
      try {
        await post('/api/agent/decline', { caseId, reason: declineReason })
        setShowDecline(false)
        router.push('/agent/cases')
        router.refresh()
      } catch (e) { setError((e as Error).message) }
    })
  }

  function handleOutcome(outcome: 'won' | 'lost') {
    setError('')
    startTransition(async () => {
      try {
        await post('/api/agent/outcome', {
          caseId,
          outcome,
          backpay_cents: outcomeBackpay
            ? Math.round(parseFloat(outcomeBackpay) * 100)
            : undefined,
          notes: outcomeNotes || undefined,
        })
        setShowOutcome(false)
        router.refresh()
      } catch (e) { setError((e as Error).message) }
    })
  }

  // Browse view — agent hasn't taken this case
  if (status === 'open' && !isMine) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-3">Accept this case?</h3>
        <p className="text-sm text-slate-400 mb-4">
          Accepting opens direct communication with the veteran. You&apos;ll be billed $250 on outcome if the case is won; no charge on loss or withdrawal.
        </p>
        <div className="flex gap-3">
          <Button variant="primary" size="md" onClick={handleAccept} disabled={pending}>
            {pending ? <Spinner size="sm" /> : 'Accept case'}
          </Button>
          <Button variant="outline" size="md" onClick={() => setShowDecline(s => !s)}>
            Not for me
          </Button>
        </div>

        {showDecline && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
            <Textarea
              label="Reason (optional — helps us improve matching)"
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              rows={2}
            />
            <Button variant="outline" size="sm" onClick={handleDecline} disabled={pending}>
              {pending ? <Spinner size="sm" /> : 'Confirm decline'}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </div>
    )
  }

  // Mine + accepted — show outcome actions
  if (isMine && status === 'accepted') {
    return (
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-1">Report outcome</h3>
        <p className="text-sm text-slate-400 mb-4">
          Once the VA issues a decision, report it here. $250 platform fee applies only to wins.
        </p>

        {!showOutcome && (
          <div className="flex gap-3">
            <Button variant="primary" size="md" onClick={() => setShowOutcome('won')}>
              Report won
            </Button>
            <Button variant="outline" size="md" onClick={() => setShowOutcome('lost')}>
              Report lost
            </Button>
          </div>
        )}

        {showOutcome && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">
              Reporting: <span className="text-gold-400">{showOutcome}</span>
            </p>
            {showOutcome === 'won' && (
              <Input
                label="Back-pay awarded (USD, optional)"
                type="number"
                min={0}
                step={0.01}
                value={outcomeBackpay}
                onChange={e => setOutcomeBackpay(e.target.value)}
                placeholder="e.g. 24500"
              />
            )}
            <Textarea
              label="Notes (optional)"
              value={outcomeNotes}
              onChange={e => setOutcomeNotes(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={() => handleOutcome(showOutcome)} disabled={pending}>
                {pending ? <Spinner size="sm" /> : `Confirm ${showOutcome}`}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowOutcome(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </div>
    )
  }

  return null
}
