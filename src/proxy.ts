import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { BETA_GATE_COOKIE, verifyGateToken } from '@/lib/beta-gate'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/pricing', '/benefits', '/for-agents', '/referral']
const DASHBOARD_ROUTE = '/dashboard'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Beta access gate ───────────────────────────────────────────────────────
  // Sits in front of everything (pages and APIs). Bypasses: the gate page
  // itself, the gate API, Next internals, and static assets.
  const betaPassword = process.env.BETA_ACCESS_PASSWORD
  const isGateExempt =
    pathname === '/beta-gate' ||
    pathname.startsWith('/beta-gate/') ||
    pathname === '/api/beta-gate' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'

  if (betaPassword && !isGateExempt) {
    const token = request.cookies.get(BETA_GATE_COOKIE)?.value
    const ok = await verifyGateToken(token, betaPassword)
    if (!ok) {
      // For API requests return 401 instead of redirecting, so XHR clients
      // get a useful error rather than HTML.
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Beta access required' }, { status: 401 })
      }
      const url = request.nextUrl.clone()
      url.pathname = '/beta-gate'
      url.search = ''
      url.searchParams.set('redirectTo', pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const isPublic =
    PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')) ||
    pathname.startsWith('/api/stripe') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/ai') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  // 1. Unauthenticated → redirect to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Authenticated → don't let them see auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url))
  }

  // IMPORTANT: always return supabaseResponse — it carries the refreshed session cookies
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
