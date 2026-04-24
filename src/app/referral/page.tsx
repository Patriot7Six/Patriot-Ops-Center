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

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR','VI','GU',
]

const SPECIALTIES = [
  { key: 'ptsd',                label: 'PTSD' },
  { key: 'mst',                 label: 'MST' },
  { key: 'tbi',                 label: 'TBI' },
  { key: 'pact',                label: 'PACT Act / Toxic Exposure' },
  { key: 'tdiu',                label: 'TDIU' },
  { key: 'appeals',             label: 'Appeals (NOD / HLR / BVA)' },
  { key: 'initial_claims',      label: 'Initial Claims' },
  { key: 'secondary_conditions', label: 'Secondary Conditions' },
  { key: 'smc',                 label: 'SMC' },
  { key: 'dic',                 label: 'DIC / Survivors' },
]

export default function ReferralIntakePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    state: '',
    condition_summary: '',
    denial_summary: '',
    current_rating: '',
    requested_rating: '',
    urgency: 'standard' as 'standard' | 'urgent',
    extra_notes: '',
    specialty_tags: [] as string[],
  })

  function toggleSpecialty(key: string) {
    setForm(f => ({
      ...f,
      specialty_tags: f.specialty_tags.includes(key)
        ? f.specialty_tags.filter(s => s !== key)
        : [...f.specialty_tags, key],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?next=/referral')
        return
      }

      const res = await fetch('/api/referrals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state:             form.state,
          condition_summary: form.condition_summary,
          denial_summary:    form.denial_summary || undefined,
          current_rating:    form.current_rating ? parseInt(form.current_rating, 10) : null,
          requested_rating:  form.requested_rating ? parseInt(form.requested_rating, 10) : null,
          urgency:           form.urgency,
          extra_notes:       form.extra_notes || undefined,
          specialty_tags:    form.specialty_tags,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || 'Failed to submit')
        return
      }

      router.push(`/dashboard/referrals/${json.case.id}`)
      router.refresh()
    })
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-white mb-3">
              Connect with a VA-accredited agent
            </h1>
            <p className="text-slate-400">
              Free for veterans. Agents only earn from back-pay wins. No upfront cost.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
            <Select
              label="Your state"
              required
              value={form.state}
              onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
              placeholder="Select a state…"
              options={US_STATES.map(s => ({ value: s, label: s }))}
            />

            <Textarea
              label="What happened / what are you claiming?"
              required
              value={form.condition_summary}
              onChange={e => setForm(f => ({ ...f, condition_summary: e.target.value }))}
              placeholder="Describe your condition, service connection, and current situation. The more detail you give, the better the match. Minimum 50 characters."
              rows={6}
            />

            <Textarea
              label="If this is an appeal, why was it denied?"
              value={form.denial_summary}
              onChange={e => setForm(f => ({ ...f, denial_summary: e.target.value }))}
              placeholder="Optional. Paste the relevant section from your denial letter or summarize what the VA said."
              rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Current rating (if any)"
                type="number"
                min={0}
                max={100}
                step={10}
                value={form.current_rating}
                onChange={e => setForm(f => ({ ...f, current_rating: e.target.value }))}
                placeholder="e.g. 30"
              />
              <Input
                label="Target rating"
                type="number"
                min={0}
                max={100}
                step={10}
                value={form.requested_rating}
                onChange={e => setForm(f => ({ ...f, requested_rating: e.target.value }))}
                placeholder="e.g. 70"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Specialties relevant to your case
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSpecialty(s.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.specialty_tags.includes(s.key)
                        ? 'bg-gold-500/10 border-gold-500/40 text-gold-400'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Select
              label="Urgency"
              value={form.urgency}
              onChange={e => setForm(f => ({ ...f, urgency: e.target.value as 'standard' | 'urgent' }))}
              options={[
                { value: 'standard', label: 'Standard — no active deadline' },
                { value: 'urgent',   label: 'Urgent — deadline or active appeal pending' },
              ]}
            />

            <Textarea
              label="Anything else an agent should know?"
              value={form.extra_notes}
              onChange={e => setForm(f => ({ ...f, extra_notes: e.target.value }))}
              placeholder="Optional. Context, prior representation, timeline, etc."
              rows={3}
            />

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? <Spinner size="sm" /> : 'Submit my case'}
            </Button>

            <p className="text-xs text-center text-slate-500">
              Your case will be reviewed and matched with VA-accredited agents in your state.
              Agents only earn back-pay fees if they win. By submitting, you agree to our{' '}
              <Link href="/terms" className="text-gold-400 hover:text-gold-300">Terms</Link>.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
