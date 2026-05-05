import { NextResponse, type NextRequest } from 'next/server'
import { BETA_GATE_COOKIE, BETA_GATE_TTL_MS, signGateToken } from '@/lib/beta-gate'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const expected = process.env.BETA_ACCESS_PASSWORD
  if (!expected) {
    return NextResponse.json({ error: 'Beta gate not configured' }, { status: 500 })
  }

  let submitted: unknown
  try {
    const body = await request.json()
    submitted = (body as { password?: unknown })?.password
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (typeof submitted !== 'string' || submitted !== expected) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = await signGateToken(expected, BETA_GATE_TTL_MS)
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: BETA_GATE_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(BETA_GATE_TTL_MS / 1000),
  })
  return res
}
