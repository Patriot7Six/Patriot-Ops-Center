// src/instrumentation.ts
// Next.js calls this once on server startup.
// Registers Sentry for Node and Edge runtimes.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}
