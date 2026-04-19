import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import WaitlistConfirmation from '@/emails/WaitlistConfirmation'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://patriot-ops.com'
const BETA_URL = process.env.NEXT_PUBLIC_BETA_URL ?? 'https://beta.patriot-ops.com'
const FROM_ADDRESS = 'Bradley Baker at Patriot Ops Center <noreply@email.patriot-ops.com>'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let body: { email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!apiKey || !audienceId) {
    console.error('Resend env vars missing', { hasKey: !!apiKey, hasAudience: !!audienceId })
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const resend = new Resend(apiKey)

  // 1. Add to audience. Duplicate → treat as success.
  const contactRes = await resend.contacts.create({
    audienceId,
    email,
    unsubscribed: false,
  })

  if (contactRes.error) {
    const msg = contactRes.error.message ?? ''
    const isDuplicate = /already exists/i.test(msg)
    if (isDuplicate) {
      return NextResponse.json({ success: true, message: "You're already on the waitlist!" })
    }
    console.error('Resend contacts.create failed', contactRes.error)
    return NextResponse.json({ error: 'Failed to join waitlist. Please try again.' }, { status: 500 })
  }

  // 2. Send confirmation email. Don't fail the signup if the email send fails.
  const sendRes = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "You're on the list — the Patriot Ops Center beta is live",
    react: WaitlistConfirmation({ email, siteUrl: SITE_URL, betaUrl: BETA_URL }),
  })

  if (sendRes.error) {
    console.error('Confirmation email send failed', sendRes.error)
  }

  return NextResponse.json({
    success: true,
    message: 'Successfully joined the waitlist! Check your inbox for confirmation.',
  })
}
