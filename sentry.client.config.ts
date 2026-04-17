// sentry.client.config.ts — place at project root
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Replay 10% of sessions, 100% of sessions with errors
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,      // masks PII in session replays
      blockAllMedia: true,
    }),
  ],

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',

  beforeSend(event) {
    // Strip any accidental PII from error messages
    if (event.request?.cookies) delete event.request.cookies
    return event
  },
})
