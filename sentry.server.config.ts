// sentry.server.config.ts — place at project root
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',

  integrations: [
    // Captures unhandled promise rejections
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
  ],
})
