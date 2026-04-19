import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://patriot-ops.com'

export const metadata: Metadata = {
  title: {
    default: 'Patriot Ops Center — Your Mission Continues',
    template: '%s | Patriot Ops Center',
  },
  description:
    'AI-powered platform helping veterans navigate VA benefits, file stronger claims, and transition to civilian careers. Benefits Navigator and Claims Copilot are always free.',
  keywords: [
    'veteran benefits',
    'VA claims',
    'military transition',
    'DD214',
    'MOS translator',
    'veteran resume',
    'TAP program',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Patriot Ops Center',
    title: 'Patriot Ops Center — Your Mission Continues',
    description:
      'VA benefits guidance, claims support, and career transition tools — built for those who served.',
  },
  metadataBase: new URL(siteUrl),
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
