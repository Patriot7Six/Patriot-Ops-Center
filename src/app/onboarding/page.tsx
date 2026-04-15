'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

type MilitaryBranch = 'Army' | 'Navy' | 'Air Force' | 'Marine Corps' | 'Coast Guard' | 'Space Force'

const BRANCHES: MilitaryBranch[] = ['Army', 'Navy', 'Air Force', 'Marine Corps', 'Coast Guard', 'Space Force']
const TOTAL_STEPS = 3

interface Form {
  branch: MilitaryBranch | ''
  rank: string
  mos: string
  ets_date: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<Form>({ branch: '', rank: '', mos: '', ets_date: '' })
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function canProceed(): boolean {
    if (step === 1) return form.branch !== ''
    if (step === 2) return form.rank.trim() !== '' && form.mos.trim() !== ''
    return true
  }

  function handleComplete() {
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      await supabase.from('profiles').update({
        branch: form.branch,
        rank: form.rank,
        mos: form.mos,
        ets_date: form.ets_date || null,
        onboarded: true,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)

      // Check for a pending plan from signup
      const pendingPlan = typeof window !== 'undefined' ? sessionStorage.getItem('pending_plan') : null
      if (pendingPlan) {
        sessionStorage.removeItem('pending_plan')
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: pendingPlan }),
        })
        const { url } = await res.json()
        if (url) { window.location.href = url; return }
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

  const mosLabel = form.branch === 'Navy' || form.branch === 'Coast Guard' ? 'Rate'
    : form.branch === 'Air Force' || form.branch === 'Space Force' ? 'AFSC'
    : 'MOS'

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4 py-12">
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(to right, #f59e0b 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs text-slate-600">{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
          {/* Step 1 — Branch */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-1">What branch did you serve?</h2>
              <p className="text-slate-500 text-sm mb-6">We&apos;ll tailor benefit recommendations to your service.</p>
              <div className="grid grid-cols-2 gap-2">
                {BRANCHES.map(b => (
                  <button
                    key={b}
                    onClick={() => update('branch', b)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium text-left border transition-all ${
                      form.branch === b
                        ? 'bg-gold-500/10 border-gold-500 text-gold-400'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — MOS / Rank */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-1">Your role</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Your {mosLabel} and rank help us find disability ratings and career equivalents.
                </p>
              </div>
              <Input
                label="Rank / Pay Grade"
                type="text"
                value={form.rank}
                onChange={e => update('rank', e.target.value)}
                placeholder="e.g. E-5 / SSG"
              />
              <Input
                label={mosLabel}
                type="text"
                value={form.mos}
                onChange={e => update('mos', e.target.value)}
                placeholder={form.branch === 'Army' ? 'e.g. 11B — Infantry' : `Your ${mosLabel}`}
              />
            </div>
          )}

          {/* Step 3 — ETS date */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-1">When did you separate?</h2>
              <p className="text-slate-500 text-sm mb-6">
                Your ETS / separation date determines filing deadlines and eligibility windows.
              </p>
              <Input
                label="Separation Date"
                type="date"
                value={form.ets_date}
                onChange={e => update('ets_date', e.target.value)}
              />
              <p className="text-xs text-slate-600 mt-2">
                Still active duty? Leave blank and update later.
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <Button variant="outline" size="md" className="flex-1" onClick={() => setStep(s => s - 1)}>
              ← Back
            </Button>
          )}
          <Button
            size="md"
            className="flex-1"
            disabled={!canProceed() || isPending}
            onClick={() => step < TOTAL_STEPS ? setStep(s => s + 1) : handleComplete()}
          >
            {isPending ? <Spinner size="sm" /> : step < TOTAL_STEPS ? 'Continue →' : 'Complete Setup →'}
          </Button>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full mt-4 text-center text-xs text-slate-600 hover:text-slate-500 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
