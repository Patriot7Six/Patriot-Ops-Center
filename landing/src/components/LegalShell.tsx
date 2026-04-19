import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-navy-950 relative">
        <div className="fixed inset-0 grid-pattern pointer-events-none" />
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, var(--color-navy-950), rgba(16,42,67,0.5) 50%, rgba(36,59,83,0.3))' }}
        />

        <div className="relative">
          <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-400 transition-colors mb-8 no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
            <p className="text-navy-400 mb-12">Last Updated: {lastUpdated}</p>

            <div className="space-y-8 text-navy-200 leading-relaxed">
              {children}
            </div>
          </article>
        </div>
      </div>
      <Footer />
    </>
  )
}
