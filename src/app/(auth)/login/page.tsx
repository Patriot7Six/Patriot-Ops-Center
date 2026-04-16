'use client'
import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

type Mode = 'password' | 'magic'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Spinner size="md" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') ?? '/dashboard'

  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message); return }
        router.push(redirectTo)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}` },
        })
        if (error) { setError(error.message); return }
        setMagicSent(true)
      }
    })
  }

  if (magicSent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Check your email</h2>
        <p className="text-slate-400 text-sm">
          We sent a sign-in link to <span className="text-white font-medium">{email}</span>.<br />It expires in 1 hour.
        </p>
        <button onClick={() => setMagicSent(false)} className="text-gold-500 hover:text-gold-400 text-sm underline underline-offset-2">
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2">Welcome back</h1>
        <p className="text-slate-400 text-sm">Sign in to access your benefits dashboard</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
        {(['password', 'magic'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-gold-500 text-navy-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            {m === 'password' ? 'Password' : 'Magic Link'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        {mode === 'password' && (
          <div>
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
            />
            <div className="flex justify-end mt-1.5">
              <Link href="/forgot-password" className="text-xs text-gold-500 hover:text-gold-400">
                Forgot password?
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending ? <Spinner size="sm" /> : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-gold-500 hover:text-gold-400 font-medium">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
