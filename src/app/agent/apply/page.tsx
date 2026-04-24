'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import type { AgentRole } from '@/types/database'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

const SPECIALTIES = [
  { key: 'ptsd',                label: 'PTSD' },
  { key: 'mst',                 label: 'MST' },
  { key: 'tbi',                 label: 'TBI' },
  { key: 'pact',                label: 'PACT Act' },
  { key: 'tdiu',                label: 'TDIU' },
  { key: 'appeals',             label: 'Appeals' },
  { key: 'initial_claims',      label: 'Initial Claims' },
  { key: 'secondary_conditions', label: 'Secondary Conditions' },
  { key: 'smc',                 label: 'SMC' },
  { key: 'dic',                 label: 'DIC' },
  { key: 'bva',                 label: 'BVA' },
  { key: 'cavc',                label: 'CAVC' },
]

export default function AgentApplyPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    role: 'attorney' as AgentRole,
    full_name: '',
    firm_name: '',
    bar_number: '',
    bar_state: '',
    ogc_accreditation_number: '',
    practice_states: [] as string[],
    specialties: [] as string[],
    phone: '',
    public_email: '',
    bio: '',
  })

  function toggleState(s: string) {
    setForm(f => ({
      ...f,
      practice_states: f.practice_states.includes(s)
        ? f.practice_states.filter(x => x !== s)
        : [...f.practice_states, s],
    }))
  }

  function toggleSpecialty(key: string) {
    setForm(f => ({
      ...f,
      specialties: f.specialties.includes(key)
        ? f.specialties.filter(x => x !== key)
        : [...f.specialties, key],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?next=/agent/apply')
        return
      }

      const res = await fetch('/api/agent/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || 'Failed to submit')
        return
      }

      router.push('/agent/dashboard')
      router.refresh()
    })
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-white mb-3">Agent application</h1>
            <p className="text-slate-400">
              We&apos;ll cross-check your info against the OGC roster. Most applications auto-verify within seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
            <Select
              label="Accreditation type"
              required
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as AgentRole }))}
              options={[
                { value: 'attorney',     label: 'VA-accredited attorney' },
                { value: 'claims_agent', label: 'VA-accredited claims agent' },
              ]}
            />

            <Input
              label="Full name (exactly as registered with OGC)"
              required
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Jane Q. Smith"
            />

            <Input
              label="Firm / practice name"
              value={form.firm_name}
              onChange={e => setForm(f => ({ ...f, firm_name: e.target.value }))}
              placeholder="Smith VA Law, PLLC"
            />

            {form.role === 'attorney' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Bar number"
                  required
                  value={form.bar_number}
                  onChange={e => setForm(f => ({ ...f, bar_number: e.target.value }))}
                />
                <Select
                  label="Bar state"
                  required
                  value={form.bar_state}
                  onChange={e => setForm(f => ({ ...f, bar_state: e.target.value }))}
                  placeholder="Select…"
                  options={US_STATES.map(s => ({ value: s, label: s }))}
                />
              </div>
            )}

            <Input
              label="OGC accreditation number (optional but speeds up verification)"
              value={form.ogc_accreditation_number}
              onChange={e => setForm(f => ({ ...f, ogc_accreditation_number: e.target.value }))}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Practice states *
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-white/[0.02] rounded-lg border border-white/10">
                {US_STATES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleState(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      form.practice_states.includes(s)
                        ? 'bg-gold-500/15 border-gold-500/40 text-gold-400'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {form.practice_states.length} selected
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Specialties
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSpecialty(s.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.specialties.includes(s.key)
                        ? 'bg-gold-500/10 border-gold-500/40 text-gold-400'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="Public contact email"
                type="email"
                value={form.public_email}
                onChange={e => setForm(f => ({ ...f, public_email: e.target.value }))}
              />
            </div>

            <Textarea
              label="Brief bio (shown to veterans when you accept their case)"
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
            />

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? <Spinner size="sm" /> : 'Submit application'}
            </Button>

            <p className="text-xs text-center text-slate-500">
              By applying, you agree to the{' '}
              <Link href="/terms" className="text-gold-400 hover:text-gold-300">Terms</Link>{' '}
              and confirm your information is accurate.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
