import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component — cookies are read-only, ignore
          }
        },
      },
    },
  )
}

/**
 * Service-role client — truly bypasses RLS.
 *
 * Uses @supabase/supabase-js directly (not @supabase/ssr) because the SSR
 * client reads user session cookies and sends the user's JWT in the
 * Authorization header on every PostgREST call. Even when constructed with
 * the service-role key, that user JWT takes precedence for RLS, defeating
 * the point of a "service" client. This plain client has no cookie/session
 * plumbing and honestly uses the service-role key as its bearer credential.
 *
 * Kept async for signature parity with callers that `await createServiceClient()`.
 */
export async function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
