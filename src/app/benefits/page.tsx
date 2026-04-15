import Link from 'next/link'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@supabase/supabase-js'

type Benefit = {
  id: string
  title: string
  category: string
  description: string
  url: string
}

export const metadata: Metadata = {
  title: 'Benefits Navigator',
  description: 'Browse all VA, DoD, and state veteran benefits in one place.',
}

const CATEGORIES = [
  {
    slug: 'disability',
    label: 'Disability',
    description: 'Compensation, ratings, and appeals',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    slug: 'education',
    label: 'Education',
    description: 'GI Bill, scholarships, and tuition',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9-5m9 5l9-5" />
      </svg>
    ),
  },
  {
    slug: 'housing',
    label: 'Housing',
    description: 'Home loans, grants, and assistance',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    slug: 'healthcare',
    label: 'Healthcare',
    description: 'VA health care and mental health',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    slug: 'career',
    label: 'Career',
    description: 'Employment, VR&E, and job training',
    color: 'text-gold-400',
    bg: 'bg-gold-500/10 border-gold-500/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

async function getBenefits(): Promise<Benefit[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data, error } = await supabase.from('benefits').select('*').order('category')
  if (error) throw new Error(`Failed to load benefits: ${error.message}`)
  return (data ?? []) as Benefit[]
}

export default async function BenefitsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const benefits = await getBenefits()
  const activeCategory = searchParams.category?.toLowerCase()
  const filtered = activeCategory
    ? benefits.filter(b => b.category.toLowerCase() === activeCategory)
    : benefits

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Header */}
        <section className="py-16 border-b border-white/6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge variant="gold" className="mb-4">Benefits Library</Badge>
            <h1 className="text-4xl font-extrabold text-white mb-3">Benefits Navigator</h1>
            <p className="text-slate-400 max-w-xl">
              The complete library of VA, DoD, and federal benefits available to veterans.
              Use the AI tools below to find exactly what you qualify for.
            </p>
          </div>
        </section>

        {/* AI Tools */}
        <section className="py-12 border-b border-white/6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
              AI-Powered Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Link
                href="/benefits/eligibility"
                className="group bg-white/3 hover:bg-white/5 border border-white/7 hover:border-gold-500/30 rounded-2xl p-7 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-5 group-hover:bg-gold-500/15 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white text-lg mb-1">VA Eligibility Checker</h3>
                <p className="text-sm text-slate-400">
                  Describe your service and get an instant AI analysis of every VA benefit you qualify for.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold-500">
                  Check now →
                </span>
              </Link>

              <Link
                href="/benefits/claims"
                className="group bg-white/3 hover:bg-white/5 border border-white/7 hover:border-gold-500/30 rounded-2xl p-7 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-5 group-hover:bg-gold-500/15 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white text-lg mb-1">Claims Copilot</h3>
                <p className="text-sm text-slate-400">
                  AI-guided step-by-step assistance to file stronger VA claims and maximize your disability rating.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold-500">
                  Start claim →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 border-b border-white/6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  href={activeCategory === cat.slug ? '/benefits' : `/benefits?category=${cat.slug}`}
                  className={`block border rounded-xl p-4 hover:opacity-90 transition-opacity ${cat.bg} ${activeCategory === cat.slug ? 'ring-2 ring-white/20' : ''}`}
                >
                  <div className={`mb-2 ${cat.color}`}>{cat.icon}</div>
                  <p className={`text-sm font-semibold ${cat.color}`}>{cat.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits List */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
              All Benefits ({filtered.length}{activeCategory && ` in ${activeCategory}`})
            </h2>
            {filtered.length === 0 ? (
              <p className="text-slate-500 text-sm">
                {activeCategory
                  ? `No benefits found in the "${activeCategory}" category.`
                  : 'No benefits found.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filtered.map((b) => (
                  <a
                    key={b.id}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white/2 hover:bg-white/4 border border-white/6 hover:border-white/10 rounded-xl p-5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Badge variant="default" className="mb-2 text-xs">{b.category}</Badge>
                        <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors text-sm mb-1">
                          {b.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{b.description}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-gold-500 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
