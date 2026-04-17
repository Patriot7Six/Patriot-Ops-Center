// src/app/layout.tsx — replaces sprint1/src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AmplitudeProvider } from '@/components/AmplitudeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Patriot Ops Center — Veteran Benefits & Career Transition',
    template: '%s | Patriot Ops Center',
  },
  description:
    'AI-powered platform helping veterans navigate VA benefits, file stronger claims, and transition to civilian careers with confidence.',
  keywords: ['veteran benefits', 'VA claims', 'military transition', 'veteran resources'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com',
    siteName: 'Patriot Ops Center',
    title: 'Patriot Ops Center — Veteran Benefits & Career Transition',
    description: 'AI-powered veteran benefits platform.',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-navy-950 text-white antialiased">
        <AmplitudeProvider>
          {children}
        </AmplitudeProvider>
        {/* Vercel Analytics — tracks page views and custom events */}
        <Analytics />
        {/* Vercel Speed Insights — tracks Core Web Vitals */}
        <SpeedInsights />
      </body>
    </html>
  )
}
