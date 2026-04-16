'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Usage = { remaining: number; limit: number } | null

export function useFreeUsage() {
  const [usage, setUsage] = useState<Usage>(null)

  useEffect(() => {
    fetch('/api/ai/usage')
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setUsage({ remaining: d.remaining, limit: d.limit }))
      .catch(() => {})
  }, [])

  function updateFromResponse(res: Response) {
    const limit = Number(res.headers.get('X-RateLimit-Limit'))
    const remaining = Number(res.headers.get('X-RateLimit-Remaining'))
    if (!Number.isNaN(limit) && !Number.isNaN(remaining) && limit > 0) {
      setUsage({ remaining, limit })
    }
  }

  return { usage, updateFromResponse }
}

export function FreeUsageBadge({ usage }: { usage: Usage }) {
  if (!usage) return null
  const low = usage.remaining <= 3
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-4 no-print">
      <span className={low ? 'text-gold-400' : ''}>
        {usage.remaining} of {usage.limit} free daily analyses remaining
      </span>
      <span className="text-slate-700">·</span>
      <Link href="/signup" className="text-gold-400 hover:text-gold-300 font-medium">
        Sign up for more
      </Link>
    </div>
  )
}
