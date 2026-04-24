'use client'
import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Spinner size="md" /></div>}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const plan = params.get('plan') // 'elite' | null
  const redirectTo = params.get('redirectTo') ?? '/onboarding'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) { setError(error.message); return }

      // If email confirmation is disabled, go straight to onboarding
      if (data.session) {
        // Optionally store plan preference to trigger checkout post-onboarding
        if (plan) sessionStorage.setItem('pending_plan', plan)
        router.push(redirectTo)
        router.refresh()
      } else {
        setConfirmSent(true)
      }
    })
  }

  if (confirmSent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Confirm your email</h2>
        <p className="text-slate-400 text-sm">
          We sent a confirmation link to <span className="text-white font-medium">{email}</span>.<br />
          Click it to activate your account.
        </p>
        <Link href="/login" className="text-gold-500 hover:text-gold-400 text-sm underline underline-offset-2">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2">
          {plan === 'elite' ? 'Start your Special Ops plan' : 'Create your account'}
        </h1>
        <p className="text-slate-400 text-sm">
          {plan ? 'Create an account, then complete setup.' : 'Free to start. No credit card required.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="John Smith"
        />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
        />

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending ? <Spinner size="sm" /> : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-xs text-slate-600 mt-4">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-slate-500 hover:text-white">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-slate-500 hover:text-white">Privacy Policy</Link>.
      </p>

      <p className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{' '}
        <Link
          href={redirectTo === '/onboarding' ? '/login' : `/login?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-gold-500 hover:text-gold-400 font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
