import Link from 'next/link'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for veteran benefits navigation. Start free forever.',
}

const PLANS = [
  {
    name: 'Patriot',
    subtitle: 'Free forever',
    price: 0,
    period: '',
    description: 'Get started with basic benefits navigation.',
    featured: false,
    cta: 'Get Started Free',
    href: '/signup',
    features: [
      { text: 'Benefits Navigator hub', included: true },
      { text: 'VA Eligibility Checker (5/month)', included: true },
      { text: 'Claims Copilot (3/month)', included: true },
      { text: 'Community access', included: true },
      { text: 'Document upload', included: false },
      { text: 'Career transition toolkit', included: false },
      { text: 'Priority claim reviews', included: false },
      { text: 'Dedicated success advisor', included: false },
    ],
  },
  {
    name: 'Special Ops',
    subtitle: 'Everything included',
    price: 124,
    period: '/month',
    description: 'Unlimited AI tools, priority reviews, and white-glove advisor support.',
    featured: true,
    cta: 'Start Special Ops',
    href: '/signup?plan=elite',
    features: [
      { text: 'Everything in Patriot', included: true },
      { text: 'Unlimited VA Eligibility checks', included: true },
      { text: 'Unlimited Claims Copilot', included: true },
      { text: 'Document upload & AI analysis', included: true },
      { text: 'Career transition toolkit', included: true },
      { text: 'Priority claim reviews', included: true },
      { text: 'Dedicated success advisor', included: true },
      { text: '1-on-1 strategy sessions (2/month)', included: true },
      { text: 'White-glove document review', included: true },
      { text: 'Concierge escalation support', included: true },
    ],
  },
]

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel anytime from your billing page — no cancellation fees, no questions asked. You keep access until the end of your billing period.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use Supabase (SOC 2 Type II) for storage, all data is encrypted at rest and in transit, and we never sell your information.',
  },
  {
    q: 'Do I need a credit card to start?',
    a: 'No. The Patriot (free) plan requires no payment information. You only enter billing details when upgrading to a paid plan.',
  },
  {
    q: 'What if I need help filing a claim?',
    a: 'The Claims Copilot walks you through the process step-by-step. Special Ops users also get access to priority claim reviews and direct advisor support.',
  },
]

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Header */}
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <Badge variant="gold" className="mb-5 mx-auto">Simple Pricing</Badge>
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
              Start free. Upgrade when ready.
            </h1>
            <p className="text-lg text-slate-400">
              No hidden fees. Cancel anytime. Your benefits journey starts on us.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {PLANS.map(plan => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border flex flex-col overflow-hidden ${
                    plan.featured
                      ? 'border-gold-500/40 bg-gold-500/[0.04]'
                      : 'border-white/[0.07] bg-white/[0.02]'
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
                  )}
                  <div className="p-8 flex-1">
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                        {plan.subtitle}
                      </p>
                      <h2 className="text-2xl font-extrabold text-white mb-1">{plan.name}</h2>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl font-extrabold text-white">
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                        </span>
                        {plan.period && (
                          <span className="text-slate-500 text-sm">{plan.period}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{plan.description}</p>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map(f => (
                        <li key={f.text} className="flex items-center gap-3">
                          <svg
                            className={`w-4 h-4 shrink-0 ${f.included ? 'text-gold-400' : 'text-slate-700'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            {f.included ? (
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 14l-4.121-4.121a1 1 0 111.414-1.414L8.414 11.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            )}
                          </svg>
                          <span className={`text-sm ${f.included ? 'text-slate-300' : 'text-slate-600'}`}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-8 pt-0">
                    <Button
                      variant={plan.featured ? 'primary' : 'outline'}
                      size="md"
                      className="w-full"
                      asChild
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-white mb-12 text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {FAQ.map(item => (
                <div key={item.q} className="border-b border-white/[0.06] pb-6">
                  <h3 className="font-semibold text-white mb-2">{item.q}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
