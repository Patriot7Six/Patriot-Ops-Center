import Link from 'next/link'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Patriot Ops Center — Your Mission Continues',
  description: 'VA benefits guidance, claims support, and career transition tools — built for those who served. Navigate your next mission with AI-powered intelligence at your side.',
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[92vh] flex items-center bg-navy-950 overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 grid-pattern" />
          {/* Radial vignette */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #0a1929 80%)' }}
          />
          {/* Gold glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 600, height: 600, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-20">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-7 animate-in delay-1">
              <div className="w-10 h-px bg-gold-600" />
              <span className="text-xs font-bold tracking-[0.18em] uppercase text-gold-500">
                AI-Powered Veteran Platform
              </span>
              <div className="w-10 h-px bg-gold-600" />
            </div>

            {/* Headline */}
            <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-black leading-[1.08] tracking-tight text-navy-50 mb-6 animate-in delay-2">
              Your Mission<br />
              <em className="not-italic text-gold-500">Continues</em>
            </h1>

            {/* Sub */}
            <p className="text-lg text-navy-300 leading-relaxed max-w-2xl mx-auto mb-10 animate-in delay-3">
              VA benefits guidance, claims support, and career transition tools — built for those who served.
              Navigate your next mission with AI-powered intelligence at your side.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-16 animate-in delay-4">
              <Link
                href="/#benefits"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-base px-8 py-3.5 rounded-lg transition-all hover:-translate-y-px no-underline"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                Access Benefits Navigator — Free
              </Link>
              <Link
                href="/#employment"
                className="inline-flex items-center gap-2 border-2 border-navy-600 hover:border-gold-500 text-navy-100 hover:text-gold-500 font-semibold text-base px-8 py-[13px] rounded-lg transition-all no-underline"
              >
                Explore Career Tools
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center justify-center border-t border-navy-800 pt-10 animate-in delay-4">
              {[
                { number: '22M+',  label: 'Veterans Served'    },
                { number: '200K',  label: 'Annual Transitions' },
                { number: '$10K+', label: 'Avg. Salary Boost'  },
                { number: '72%',   label: 'Claims Success Rate'},
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`px-10 text-center ${i < 3 ? 'border-r border-navy-800' : ''}`}
                >
                  <div className="text-[2rem] font-extrabold text-gold-400 leading-none mb-1">{stat.number}</div>
                  <div className="text-xs text-navy-400 tracking-widest uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            FREE TOOLS BANNER
        ════════════════════════════════════════════════════════ */}
        <div
          className="border-t border-b border-navy-800 py-3.5 px-6"
          style={{ background: 'linear-gradient(135deg, rgba(16,42,67,0.9), rgba(36,59,83,0.9))' }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap text-sm">
            <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full">
              Always Free
            </span>
            <strong className="text-gold-400">Benefits Navigator &amp; Claims Copilot</strong>
            <span className="text-navy-300">—</span>
            <span className="text-navy-300">No account required. No credit card. No strings. Built to serve those who served.</span>
            <Link
              href="/#benefits"
              className="bg-white/5 hover:bg-gold-500/10 border border-navy-700 hover:border-gold-600 text-navy-200 hover:text-gold-400 text-xs font-semibold px-4 py-2 rounded-lg transition-all no-underline"
            >
              Explore the tools →
            </Link>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            TWO WINGS — Benefits + Employment
        ════════════════════════════════════════════════════════ */}
        <section id="benefits" className="bg-navy-950 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Section header */}
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <div className="w-7 h-0.5 bg-gold-500" />
                <span className="text-xs font-bold tracking-[0.18em] uppercase text-gold-500">The Platform</span>
                <div className="w-7 h-0.5 bg-gold-500" />
              </div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold leading-tight tracking-tight text-navy-50 mb-4">
                Two missions. One platform.
              </h2>
              <p className="text-navy-300 leading-relaxed text-center">
                Veterans get free benefits support forever. Employment tools grow with you — start free, upgrade when you're ready.
              </p>
            </div>

            {/* Wings grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">

              {/* Left Wing — Benefits (Always Free) */}
              <div className="corner-brackets scanning-line bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
                <div className="p-8 border-b border-navy-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-2xl">🛡️</div>
                    <span className="inline-flex items-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                      Always Free
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-navy-50 mb-2">Benefits Navigator</h3>
                  <p className="text-sm text-navy-400 leading-relaxed">
                    AI-guided VA benefits, claims copilot, and a 1-year transition timeline — for every veteran, always free.
                  </p>
                </div>
                <div className="p-8">
                  <ul className="space-y-3">
                    {[
                      ['VA Eligibility Checker', 'Discover every benefit you\'ve earned based on service'],
                      ['Claims Copilot', 'AI-guided walkthrough for filing and tracking VA claims'],
                      ['1-Year Transition Timeline', 'Interactive checklist from active duty to civilian life'],
                      ['DD214 Upload & Parsing', 'Extract and interpret your service record automatically'],
                      ['Document Vault', 'Secure storage for separation docs, VA correspondence, and more'],
                      ['VSO & Legal Referrals', 'Connect to vetted advocates in your area'],
                    ].map(([title, desc]) => (
                      <li key={title} className="flex items-start gap-2.5">
                        <span className="w-[18px] h-[18px] rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">✓</span>
                        <span className="text-sm text-navy-200 leading-snug">
                          <strong className="text-navy-100">{title}</strong> — {desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7">
                    <Link
                      href="/benefits"
                      className="flex items-center justify-center w-full border-2 border-navy-600 hover:border-gold-500 text-navy-100 hover:text-gold-500 font-semibold text-sm py-3 rounded-lg transition-all no-underline"
                    >
                      Access Benefits Navigator →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Wing — Employment Tools (Freemium) */}
              <div id="employment" className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
                <div className="p-8 border-b border-navy-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/15 flex items-center justify-center text-2xl">🎯</div>
                    <span className="inline-flex items-center bg-gold-500/15 text-gold-400 border border-gold-500/30 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                      Freemium → Pro
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-navy-50 mb-2">Employment Tools</h3>
                  <p className="text-sm text-navy-400 leading-relaxed">
                    Translate military experience into civilian success. AI resume builder, interview coach, salary insights, and more.
                  </p>
                </div>
                <div className="p-8">
                  <ul className="space-y-3">
                    {[
                      ['MOS Translator', 'Convert military occupational codes to civilian job titles and skills'],
                      ['AI Resume Generator', 'ATS-optimized resumes from your service record (1 free)'],
                      ['Interview Prep Coach', 'STAR method practice with AI feedback on military-to-civilian framing'],
                      ['Salary Intelligence', 'Real market data for your MOS-to-role transition by location'],
                      ['Job Board', '20 curated veteran-friendly listings (unlimited on Pro)'],
                      ['Clearance Marketplace', 'Exclusive TS/SCI and Secret-cleared opportunities'],
                    ].map(([title, desc]) => (
                      <li key={title} className="flex items-start gap-2.5">
                        <span className="w-[18px] h-[18px] rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">✓</span>
                        <span className="text-sm text-navy-200 leading-snug">
                          <strong className="text-navy-100">{title}</strong> — {desc}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7">
                    <Link
                      href="/signup"
                      className="flex items-center justify-center w-full bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm py-3 rounded-lg transition-all hover:-translate-y-px no-underline"
                    >
                      Start for Free →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            365-DAY TRANSITION TIMELINE
        ════════════════════════════════════════════════════════ */}
        <section id="timeline" className="bg-navy-900 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">

              {/* Left — copy */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-0.5 bg-gold-500" />
                  <span className="text-xs font-bold tracking-[0.18em] uppercase text-gold-500">Transition Support</span>
                </div>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold leading-tight tracking-tight text-navy-50 mb-4">
                  Your 365-day<br />mission brief
                </h2>
                <div className="w-10 h-0.5 bg-gradient-to-r from-gold-500 to-gold-700 mb-6" />
                <p className="text-navy-300 leading-relaxed mb-8 max-w-md">
                  From your first conversation with your commander about separation to the day you walk into your civilian career — we walk every step with you. Interactive checklist, automated reminders, and AI guidance at every milestone.
                </p>

                <div className="flex flex-col gap-4 mb-8">
                  {[
                    ['Pre-separation counseling & TAP', '12 months before ETS/EAS'],
                    ['Benefits enrollment & VA claims filing', '6 months before ETS/EAS'],
                    ['Resume, interviews & job search', '3 months before ETS/EAS'],
                    ['First 90 days in your new role', 'Post-transition support'],
                  ].map(([title, sub]) => (
                    <div key={title} className="military-stripe">
                      <div className="text-sm text-navy-200 font-semibold">{title}</div>
                      <div className="text-xs text-navy-400 mt-0.5">{sub}</div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/signup"
                  className="inline-flex bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm px-7 py-3 rounded-lg transition-all hover:-translate-y-px no-underline"
                >
                  View Full Timeline
                </Link>
              </div>

              {/* Right — timeline visual */}
              <div className="corner-brackets bg-navy-800 border border-navy-700 rounded-2xl p-7">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold tracking-widest uppercase text-gold-600">Sample Transition Plan</span>
                  <span className="bg-gold-500/15 text-gold-400 border border-gold-500/30 text-[0.6rem] font-bold px-2 py-0.5 rounded">8 months out</span>
                </div>

                <div className="flex flex-col">
                  {[
                    { title: 'Month 12 — Intent to separate',       sub: 'Notify chain of command, start TAP enrollment',            status: 'done'    },
                    { title: 'Month 10 — DD214 prep & VA pre-file',  sub: 'Upload service records, begin C&P exam scheduling',        status: 'done'    },
                    { title: 'Month 8 — Benefits Navigator',         sub: 'Eligibility review, GI Bill activation, housing allowance', status: 'active'  },
                    { title: 'Month 6 — Resume & MOS translation',   sub: 'AI resume generation, civilian job title mapping',          status: 'pending' },
                    { title: 'Month 3 — Interview prep & job search',sub: 'STAR coaching, salary negotiation, job applications',       status: 'pending' },
                    { title: 'Day 1 — Mission complete',             sub: 'First day in your civilian role',                           status: 'pending' },
                  ].map((item, i) => (
                    <div key={item.title} className={`flex items-center gap-4 py-3 ${i < 5 ? 'border-b border-navy-700' : ''}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 ${
                        item.status === 'done'
                          ? 'border-gold-500 bg-gold-500'
                          : item.status === 'active'
                          ? 'border-gold-400 bg-transparent shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                          : 'border-navy-600 bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-navy-100">{item.title}</div>
                        <div className="text-[0.72rem] text-navy-400 mt-0.5">{item.sub}</div>
                      </div>
                      <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                        item.status === 'done'
                          ? 'bg-gold-500/15 text-gold-400'
                          : item.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-navy-700/50 text-navy-400'
                      }`}>
                        {item.status === 'done' ? 'Done' : item.status === 'active' ? 'Active' : 'Upcoming'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-5 pt-4 border-t border-navy-700 flex items-center gap-3">
                  <div className="text-xs text-navy-400">Progress</div>
                  <div className="flex-1 h-1 bg-navy-700 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-gold-500 rounded-full" />
                  </div>
                  <div className="text-xs text-gold-500 font-semibold">33%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════════════════════ */}
        <section className="bg-navy-950 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <div className="w-7 h-0.5 bg-gold-500" />
                <span className="text-xs font-bold tracking-[0.18em] uppercase text-gold-500">How It Works</span>
                <div className="w-7 h-0.5 bg-gold-500" />
              </div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold leading-tight tracking-tight text-navy-50">
                From service record<br />to civilian success
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 max-w-5xl mx-auto">
              {[
                {
                  n: '01', emoji: '📋',
                  title: 'Upload your record',
                  desc: 'Submit your DD214 or answer a few questions about your service. Our AI parses your MOS, rank, deployments, and qualifications instantly.',
                  arrow: true,
                },
                {
                  n: '02', emoji: '🧭',
                  title: 'Navigate your benefits',
                  desc: 'Discover every VA benefit you\'ve earned, get guided help filing claims, and follow your personalized 1-year transition checklist.',
                  arrow: true,
                },
                {
                  n: '03', emoji: '🎯',
                  title: 'Launch your career',
                  desc: 'Generate AI-optimized resumes, practice interviews with our STAR coach, and land roles that match your clearance, skills, and ambitions.',
                  arrow: false,
                },
              ].map(step => (
                <div key={step.n} className="relative bg-navy-900 border border-navy-800 rounded-xl p-9">
                  <div className="text-[4rem] font-black text-gold-500/10 leading-none mb-4 tabular-nums">{step.n}</div>
                  <div className="text-2xl mb-3">{step.emoji}</div>
                  <h3 className="text-lg font-bold text-navy-50 mb-2">{step.title}</h3>
                  <p className="text-sm text-navy-300 leading-relaxed">{step.desc}</p>
                  {step.arrow && (
                    <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 text-navy-600 text-xl z-10 hidden md:block">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            PRICING
        ════════════════════════════════════════════════════════ */}
        <section id="pricing" className="bg-navy-900 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <div className="w-7 h-0.5 bg-gold-500" />
                <span className="text-xs font-bold tracking-[0.18em] uppercase text-gold-500">Pricing</span>
                <div className="w-7 h-0.5 bg-gold-500" />
              </div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold leading-tight tracking-tight text-navy-50 mb-3">
                Serve first. Scale when ready.
              </h2>
              <p className="text-navy-300 max-w-md mx-auto">
                Benefits Navigator is permanently free. Career tools start free and grow with your ambitions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">

              {/* Free */}
              <div className="bg-navy-900 border border-navy-700 rounded-2xl p-8 flex flex-col">
                <div className="mb-6">
                  <span className="inline-flex items-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                    Free Forever
                  </span>
                  <div className="text-[2.2rem] font-black text-navy-50 leading-none">$0</div>
                  <div className="text-sm text-navy-400 mt-1">No credit card needed</div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {[
                    ['check', 'Full Benefits Navigator'],
                    ['check', 'Claims Copilot'],
                    ['check', '1-Year Transition Timeline'],
                    ['check', 'DD214 Upload & Parse'],
                    ['check', '1 AI Resume Generation'],
                    ['check', '20 Job Listings'],
                    ['check', '3 Interview Prep Sessions'],
                    ['x',     'Salary Negotiation Scripts'],
                    ['x',     'Clearance Marketplace'],
                  ].map(([type, text]) => (
                    <li key={text} className="flex items-start gap-2 text-sm">
                      <span className={type === 'check' ? 'text-gold-500 flex-shrink-0 mt-0.5' : 'text-navy-600 flex-shrink-0 mt-0.5'}>
                        {type === 'check' ? '✓' : '✗'}
                      </span>
                      <span className={type === 'check' ? 'text-navy-200' : 'text-navy-500'}>{text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="flex items-center justify-center w-full border-2 border-navy-600 hover:border-gold-500 text-navy-100 hover:text-gold-500 font-semibold text-sm py-3 rounded-lg transition-all no-underline">
                  Get Started Free
                </Link>
              </div>

              {/* Pro — featured */}
              <div
                className="border border-gold-600 rounded-2xl p-8 flex flex-col md:scale-[1.03]"
                style={{
                  background: 'linear-gradient(135deg, #102a43, rgba(36,59,83,0.8))',
                  boxShadow: '0 0 0 1px rgba(245,158,11,0.1)',
                }}
              >
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="inline-flex items-center bg-gold-500/15 text-gold-400 border border-gold-500/30 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <div className="text-[2.2rem] font-black text-navy-50 leading-none">
                      <sup className="text-base align-super">$</sup>34
                    </div>
                    <span className="text-sm text-navy-400 ml-1">/month</span>
                  </div>
                  <div className="text-xs text-gold-600 mt-1">or $299/year — save 2 months</div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {[
                    'Everything in Free',
                    'Unlimited AI Resume Versions',
                    'Unlimited Interview Prep',
                    'Salary Insights + Negotiation Scripts',
                    'Unlimited Job Listings',
                    'Cover Letter Generator',
                    'Veteran Mentor Network',
                    'LinkedIn Auto-Optimizer',
                  ].map(text => (
                    <li key={text} className="flex items-start gap-2 text-sm">
                      <span className="text-gold-500 flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-navy-200">{text}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-navy-600 flex-shrink-0 mt-0.5">✗</span>
                    <span className="text-navy-500">1-on-1 Coaching Sessions</span>
                  </li>
                </ul>
                <Link href="/signup?plan=pro" className="flex items-center justify-center w-full bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm py-3 rounded-lg transition-all hover:-translate-y-px no-underline">
                  Start Pro — 7 Days Free
                </Link>
              </div>

              {/* Elite */}
              <div className="bg-navy-900 border border-navy-700 rounded-2xl p-8 flex flex-col">
                <div className="mb-6">
                  <span className="inline-flex items-center bg-navy-700/50 text-navy-200 border border-navy-600 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                    Elite
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <div className="text-[2.2rem] font-black text-navy-50 leading-none">
                      <sup className="text-base align-super">$</sup>124
                    </div>
                    <span className="text-sm text-navy-400 ml-1">/month</span>
                  </div>
                  <div className="text-xs text-gold-600 mt-1">or $999/year — best value</div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {[
                    'Everything in Pro',
                    'Monthly 1-on-1 Coaching',
                    'Resume + LinkedIn Pro Review',
                    'Mock Interview Sessions (AI + Human)',
                    'Direct Employer Introductions',
                    'Clearance Marketplace Access',
                    'Exclusive Unlisted Positions',
                    'AI Career Coach (Persistent Context)',
                    'Priority Support',
                  ].map(text => (
                    <li key={text} className="flex items-start gap-2 text-sm">
                      <span className="text-gold-500 flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-navy-200">{text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=elite" className="flex items-center justify-center w-full border-2 border-navy-600 hover:border-gold-500 text-navy-100 hover:text-gold-500 font-semibold text-sm py-3 rounded-lg transition-all no-underline">
                  Go Elite
                </Link>
              </div>
            </div>

            {/* 100 for 100 program */}
            <div
              className="max-w-2xl mx-auto mt-8 text-center rounded-xl border border-gold-500/20 px-7 py-5"
              style={{ background: 'rgba(245,158,11,0.04)' }}
            >
              <p className="text-sm text-navy-200 leading-relaxed">
                <strong className="text-gold-400">100 for 100 Program:</strong> 100 free Pro subscriptions reserved for 100% disabled veterans. No application required — verify your rating and the platform takes care of the rest.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            FOR ORGANIZATIONS
        ════════════════════════════════════════════════════════ */}
        <section id="organizations" className="bg-navy-900 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start max-w-5xl mx-auto">

              {/* Left — copy */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-0.5 bg-gold-500" />
                  <span className="text-xs font-bold tracking-[0.18em] uppercase text-gold-500">For Organizations</span>
                </div>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold leading-tight tracking-tight text-navy-50 mb-4">
                  Bring the mission<br />to your members
                </h2>
                <div className="w-10 h-0.5 bg-gradient-to-r from-gold-500 to-gold-700 mb-6" />
                <p className="text-navy-300 leading-relaxed mb-8 max-w-md">
                  VSOs, law firms, TAP programs, and employers get their own fully white-labeled tenant — with a dedicated admin dashboard, member management, and reporting tools. Your members retain full ownership of their accounts.
                </p>

                <div className="flex flex-col gap-3 mb-8">
                  {[
                    'Isolated tenant data with Supabase RLS',
                    'Branded portal on your subdomain',
                    'Member invite, role assignment, progress tracking',
                    'Veterans retain their accounts if they leave your org',
                    'TAP-ready bulk licensing & DoD integration path',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-navy-200">
                      <span className="text-gold-500 font-bold">✓</span>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Link href="/#organizations" className="inline-flex bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm px-6 py-3 rounded-lg transition-all hover:-translate-y-px no-underline">
                    Request a Demo
                  </Link>
                  <Link href="/pricing" className="inline-flex border-2 border-navy-600 hover:border-gold-500 text-navy-100 hover:text-gold-500 font-semibold text-sm px-6 py-[11px] rounded-lg transition-all no-underline">
                    View Org Pricing
                  </Link>
                </div>
              </div>

              {/* Right — org cards */}
              <div className="flex flex-col gap-3.5">
                {[
                  {
                    type: 'VSOs & Nonprofits',
                    title: 'VFW, American Legion, Wounded Warrior & more',
                    desc: 'Member portal, benefits tracking, bulk licensing, and co-branded experience. Revenue share model available.',
                  },
                  {
                    type: 'Legal & Claims',
                    title: 'VA accredited attorneys & claims agents',
                    desc: 'Case management dashboard, client progress tracking, document sharing, and secure communication tools.',
                  },
                  {
                    type: 'TAP & Government',
                    title: 'Transition Assistance Programs on military installations',
                    desc: 'White-label deployment, DoD system integration path, cohort tracking, and outcome reporting for commanders.',
                  },
                  {
                    type: 'Employers',
                    title: 'Fortune 500 veteran hiring programs',
                    desc: 'Anonymized candidate pool, MOS-to-role match scoring, featured listings, and veteran retention analytics.',
                  },
                ].map(card => (
                  <div
                    key={card.type}
                    className="bg-navy-800 border border-navy-700 border-l-[3px] border-l-gold-600 hover:border-l-gold-400 rounded-xl p-7 transition-colors"
                  >
                    <div className="text-xs font-bold tracking-widest uppercase text-gold-600 mb-1.5">{card.type}</div>
                    <h3 className="text-base font-bold text-navy-50 mb-2">{card.title}</h3>
                    <p className="text-sm text-navy-300 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════════════════════ */}
        <section className="relative bg-navy-950 border-t border-navy-800 py-24 px-6 text-center overflow-hidden">
          {/* Gold glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 500, height: 300, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-5">
              <div className="w-7 h-0.5 bg-gold-500" />
              <span className="text-xs font-bold tracking-[0.18em] uppercase text-gold-500">Start Today</span>
              <div className="w-7 h-0.5 bg-gold-500" />
            </div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-tight tracking-tight text-navy-50 mb-5">
              You've earned these benefits.<br />
              <em className="not-italic text-gold-500">Let's make sure you get them.</em>
            </h2>
            <p className="text-navy-300 leading-relaxed mb-10 max-w-lg mx-auto">
              No account needed to start. Access the Benefits Navigator and Claims Copilot right now — completely free, forever.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/benefits"
                className="inline-flex bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-base px-9 py-4 rounded-lg transition-all hover:-translate-y-px no-underline"
              >
                Access Benefits Navigator — Free
              </Link>
              <Link
                href="/signup"
                className="inline-flex border-2 border-navy-600 hover:border-gold-500 text-navy-100 hover:text-gold-500 font-semibold text-base px-9 py-[15px] rounded-lg transition-all no-underline"
              >
                Create Your Free Account
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
