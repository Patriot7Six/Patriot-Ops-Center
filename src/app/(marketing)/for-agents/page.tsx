import Link from 'next/link'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'For VA-Accredited Attorneys & Claims Agents',
  description: 'Join Patriot Ops Center to receive pre-qualified veteran case referrals. No monthly fees — pay only when you win.',
}

const STATS = [
  { figure: '$0',    label: 'Monthly fee to join' },
  { figure: '$250',  label: 'Per case accepted' },
  { figure: '100%',  label: 'Referrals are VA-accredited only' },
]

const VALUE_PROPS = [
  {
    title: 'Pre-qualified cases',
    body:  'Every case submitted goes through AI screening before it reaches you — we attach a strength score, condition summary, and (where available) the denial letter. No cold intake calls.',
  },
  {
    title: 'Free to join',
    body:  'Zero subscription. Zero per-lead fees for cases you don\'t take. You pay $250 only when you accept a case — and only if it meets your capacity and specialty filters.',
  },
  {
    title: 'OGC verified',
    body:  'We cross-check every agent against the OGC accredited-representatives roster before giving them case access. The platform stays clean, so veterans trust the matches.',
  },
  {
    title: 'You stay in control',
    body:  'Set your practice states, specialties, and max concurrent cases. Decline anything that doesn\'t fit. No platform pressure to take cases you can\'t handle well.',
  },
]

export default function ForAgentsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <Badge variant="gold" className="mb-5 mx-auto">For Accredited Representatives</Badge>
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
              Get matched with veteran cases that fit your practice.
            </h1>
            <p className="text-lg text-slate-400 mb-8">
              We run the intake, the AI screening, and the matching. You review, accept, and represent. $250 per case — no monthly fees.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link href="/agent/apply">Apply to join →</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="py-12 border-y border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold text-gold-400 mb-1">{s.figure}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Value props */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            {VALUE_PROPS.map(v => (
              <div key={v.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <h3 className="font-bold text-white text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-white mb-12 text-center">How it works</h2>
            <ol className="space-y-8">
              {[
                { n: 1, title: 'Apply',         body: 'Fill out a short form with your bar or OGC number, practice states, and specialties. Most agents are auto-verified against the OGC roster within seconds.' },
                { n: 2, title: 'Browse cases',  body: 'Your inbox shows open cases in your practice states, sorted by match score. Each case includes a condition summary, veteran-uploaded denial letter (when applicable), and an estimated strength score.' },
                { n: 3, title: 'Accept',        body: 'If a case fits your capacity and expertise, accept it. The veteran is notified immediately and you get contact details.' },
                { n: 4, title: 'Represent',     body: 'You handle the representation under a standard 38 CFR § 14.636 fee agreement directly with the veteran. Patriot Ops Center is a referral platform, not a party to representation.' },
                { n: 5, title: 'Report outcome', body: 'When the VA decision lands, report the outcome in-platform. You\'re billed $250 per accepted case. If the case is lost or withdrawn, no per-case charge.' },
              ].map(step => (
                <li key={step.n} className="flex gap-5">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 border-t border-white/[0.06] text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-white mb-3">Ready to see cases?</h2>
            <p className="text-slate-400 mb-6">
              Application takes 3 minutes. Most applicants are verified and active the same day.
            </p>
            <Button variant="primary" size="lg" asChild>
              <Link href="/agent/apply">Apply to join →</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
