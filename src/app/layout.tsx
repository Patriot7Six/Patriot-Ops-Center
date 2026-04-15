import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
  // Next.js auto-discovers src/app/icon.png and src/app/icon.svg as the favicon.
  // No manual <link rel="icon"> needed — Next.js handles it.
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com',
    siteName: 'Patriot Ops Center',
    title: 'Patriot Ops Center — Veteran Benefits & Career Transition',
    description: 'AI-powered veteran benefits platform.',
    images: [
      {
        url: '/logo.png',
        width: 990,
        height: 990,
        alt: 'Patriot Ops Center',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Patriot Ops Center',
    description: 'AI-powered veteran benefits platform.',
    images: ['/logo.png'],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-navy-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
