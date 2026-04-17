// src/app/api/launch/announce/route.ts
// Protected admin route — triggers the launch announcement to the Resend audience.
// Requires ADMIN_SECRET in Doppler. Call once when going live at patriot-ops.com.
//
// Usage:
//   curl -X POST https://patriot-ops.com/api/launch/announce \
//     -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"confirm": true}'

import { NextResponse, type NextRequest } from 'next/server'
import { sendLaunchAnnouncement } from '@/lib/resend-audiences'

export async function POST(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  // Require explicit confirmation to prevent accidental sends
  if (!body.confirm) {
    return NextResponse.json(
      { error: 'Pass { "confirm": true } in the request body to send the announcement.' },
      { status: 400 },
    )
  }

  try {
    const result = await sendLaunchAnnouncement()
    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Launch announcement failed:', err)
    return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 })
  }
}
