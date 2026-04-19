'use client'
import { useState } from 'react'
import Link from 'next/link'

const BETA_URL = process.env.NEXT_PUBLIC_BETA_URL ?? 'https://beta.patriot-ops.com'

const NAV_ITEMS = [
  { href: '/#benefits',      label: 'Benefits Navigator' },
  { href: '/#employment',    label: 'Career Tools'       },
  { href: '/#organizations', label: 'For Organizations'  },
  { href: '/#faq',           label: 'FAQ'                },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 border-b border-navy-800"
      style={{ background: 'rgba(10,25,41,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2.5 shrink-0 no-underline">
          <img src="/logo.svg" alt="Patriot Ops Center logo" className="h-14 w-14 object-contain" />
          <span className="font-extrabold text-base tracking-widest uppercase text-navy-50">
            Patriot <span className="text-gold-500">Ops</span> Center
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1 list-none">
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-navy-300 hover:text-gold-400 hover:bg-gold-500/[0.08] text-sm font-medium px-3.5 py-1.5 rounded-md transition-colors no-underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-navy-400">
            <span className="status-dot" />
            <span>Beta Live</span>
          </div>
          <a
            href={BETA_URL}
            className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm px-4 py-2 rounded-lg transition-all hover:-translate-y-px no-underline"
          >
            Enter Beta →
          </a>
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-navy-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-navy-800 bg-navy-950 px-6 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-navy-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors no-underline"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-navy-800">
            <a
              href={BETA_URL}
              onClick={() => setOpen(false)}
              className="block w-full text-center bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm px-4 py-3 rounded-lg transition-colors no-underline"
            >
              Enter Beta →
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
