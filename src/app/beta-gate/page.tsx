'use client'
import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export default function BetaGatePage() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(to right, #f59e0b 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold-500/5 blur-3xl pointer-events-none" />

      <header className="relative z-10 h-16 flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Patriot Ops Center"
            className="h-8 w-8 object-contain"
          />
          <span className="font-bold text-white text-sm tracking-tight">Patriot Ops Center</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8">
          <Suspense fallback={<div className="flex justify-center py-10"><Spinner size="md" /></div>}>
            <BetaGateForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

function BetaGateForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') || '/'

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/beta-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string } | null
        setError(body?.error ?? 'Incorrect password')
        return
      }
      router.replace(redirectTo)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Private beta</h1>
        <p className="text-slate-400 text-sm">
          Enter the access password to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Access password"
          type="password"
          required
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" disabled={isPending || !password} className="w-full">
          {isPending ? <Spinner size="sm" /> : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
