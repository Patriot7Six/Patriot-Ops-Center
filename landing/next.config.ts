import type { NextConfig } from 'next'
import path from 'node:path'

// Pin Next.js / Turbopack to THIS directory so it can't discover
// parent-repo files (sentry configs, src/instrumentation.ts, etc.)
// when Vercel exposes them during the build.
const ROOT = path.resolve('.')

const nextConfig: NextConfig = {
  turbopack: {
    root: ROOT,
  },
  outputFileTracingRoot: ROOT,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://patriot-ops.com",
              "connect-src 'self' https://api.resend.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
