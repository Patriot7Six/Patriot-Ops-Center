'use client'
import { useState } from 'react'
import Link from 'next/link'

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 border-b border-navy-800"
      style={{ background: 'rgba(10,25,41,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* ── Logo — uses real brand asset ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 no-underline">
          <img src="/logo.png" alt="Patriot Ops Center logo" className="h-9 w-9 object-contain" />
          <span className="font-extrabold text-base tracking-widest uppercase text-navy-50">
            Patriot <span className="text-gold-500">Ops</span> Center
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className="hidden md:flex items-center gap-1 list-none">
          {[
            { href: '/#benefits',      label: 'Benefits Navigator' },
            { href: '/#employment',    label: 'Career Tools'       },
            { href: '/#organizations', label: 'For Organizations'  },
            { href: '/pricing',        label: 'Pricing'            },
          ].map(item => (
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

        {/* ── Desktop right: status indicator + CTA ── */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-navy-400">
            <span className="status-dot" />
            <span>System Operational</span>
          </div>
          <Link
            href="/signup"
            className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm px-4 py-2 rounded-lg transition-all hover:-translate-y-px no-underline"
          >
            Get Started Free
          </Link>
        </div>

        {/* ── Mobile hamburger ── */}
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

      {/* ── Mobile menu ── */}
      {open && (
        <div className="md:hidden border-t border-navy-800 bg-navy-950 px-6 py-4 space-y-1">
          {[
            { href: '/#benefits',      label: 'Benefits Navigator' },
            { href: '/#employment',    label: 'Career Tools'       },
            { href: '/#organizations', label: 'For Organizations'  },
            { href: '/pricing',        label: 'Pricing'            },
          ].map(item => (
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
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="block w-full text-center bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm px-4 py-3 rounded-lg transition-colors no-underline"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
