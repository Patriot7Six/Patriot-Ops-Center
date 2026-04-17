'use client'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { component: 'GlobalErrorBoundary' },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-2">Something went wrong</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          We hit an unexpected error. Our team has been automatically notified.
          Try refreshing the page — if the problem persists, contact support.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} size="md">Try again</Button>
          <Button variant="secondary" size="md" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-left bg-red-500/5 border border-red-500/20 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-red-400 mb-1">Dev error details:</p>
            <p className="text-xs text-red-400/70 font-mono break-all">{error.message}</p>
            {error.digest && <p className="text-xs text-red-400/50 mt-1">Digest: {error.digest}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
