'use client'
import { useState, type FormEvent } from 'react'

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus({ kind: 'loading' })

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus({ kind: 'error', message: data?.error ?? 'Something went wrong. Please try again.' })
        return
      }

      setStatus({ kind: 'success', message: data?.message ?? "You're on the list!" })
      setEmail('')
    } catch {
      setStatus({ kind: 'error', message: 'Network error. Please try again.' })
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? 'w-full' : 'max-w-md w-full'}>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={status.kind === 'loading'}
          className="flex-1 px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 text-navy-50 placeholder:text-navy-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all disabled:opacity-60"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status.kind === 'loading'}
          className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 disabled:cursor-not-allowed text-navy-900 font-semibold text-sm px-6 py-3 rounded-lg transition-all hover:-translate-y-px whitespace-nowrap"
        >
          {status.kind === 'loading' ? 'Joining…' : 'Join the Waitlist'}
        </button>
      </div>

      {status.kind === 'success' && (
        <p role="status" className="mt-3 text-sm text-emerald-400 flex items-start gap-2">
          <span className="mt-0.5">✓</span>
          <span>{status.message}</span>
        </p>
      )}
      {status.kind === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-400 flex items-start gap-2">
          <span className="mt-0.5">✗</span>
          <span>{status.message}</span>
        </p>
      )}
      {status.kind === 'idle' && (
        <p className="mt-3 text-xs text-navy-500">
          No spam. Unsubscribe anytime. We'll only email you about launch milestones and early-access details.
        </p>
      )}
    </form>
  )
}
