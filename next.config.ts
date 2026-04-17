// next.config.ts — replaces sprint6/next.config.ts
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://browser.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.stripe.com https://o*.ingest.sentry.io https://api.amplitude.com https://cdn.amplitude.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "worker-src blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org:     process.env.SENTRY_ORG     ?? 'patriot-ops-center',
  project: process.env.SENTRY_PROJECT ?? 'patriot-ops-center',

  // Upload source maps during CI builds only
  silent:           !process.env.CI,
  widenClientFileUpload: true,
  disableLogger:    true,

  // Automatically instrument Next.js data fetching methods
  automaticVercelMonitors: true,
})
