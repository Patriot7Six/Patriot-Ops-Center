import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/benefits', '/signup', '/login'],
        disallow: ['/dashboard/', '/onboarding/', '/api/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
