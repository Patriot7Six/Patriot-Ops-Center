import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(to right, #f59e0b 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 h-16 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Patriot Ops Center"
            className="h-8 w-8 object-contain"
          />
          <span className="font-bold text-white text-sm tracking-tight">Patriot Ops Center</span>
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
