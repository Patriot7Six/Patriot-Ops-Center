import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://patriot-ops.com'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get('email')?.toLowerCase() ?? ''

  if (!email) {
    return htmlResponse(errorHtml('Invalid unsubscribe link'), 400)
  }

  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!apiKey || !audienceId) {
    console.error('Resend env vars missing in unsubscribe handler')
    return htmlResponse(errorHtml('Server configuration error'), 500)
  }

  const auth = { Authorization: `Bearer ${apiKey}` }

  // Resend's SDK lists contacts without a direct "find by email" — use raw API to paginate.
  let contactId: string | null = null
  const listRes = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    headers: auth,
  })
  if (!listRes.ok) {
    console.error('Failed to list contacts', listRes.status, await listRes.text())
    return htmlResponse(errorHtml('Failed to process unsubscribe request'), 500)
  }
  const listData = (await listRes.json()) as { data?: Array<{ id: string; email: string }> }
  const match = listData.data?.find(c => c.email.toLowerCase() === email)
  contactId = match?.id ?? null

  // Treat "not found" as success — the user's intent is to not receive emails.
  if (!contactId) return htmlResponse(successHtml(), 200)

  const patchRes = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts/${contactId}`,
    {
      method: 'PATCH',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unsubscribed: true }),
    }
  )

  if (!patchRes.ok) {
    console.error('Failed to update contact', patchRes.status, await patchRes.text())
    return htmlResponse(errorHtml('Failed to unsubscribe'), 500)
  }

  return htmlResponse(successHtml(), 200)
}

// ── helpers ─────────────────────────────────────────────────────────────

function htmlResponse(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function page(title: string, iconColor: string, iconPath: string, heading: string, message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Patriot Ops Center</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0a1929;color:#d9e2ec;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{max-width:480px;text-align:center}
    .icon{width:64px;height:64px;background:${iconColor}1a;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px}
    .icon svg{width:32px;height:32px;color:${iconColor}}
    h1{color:#f59e0b;font-size:24px;margin-bottom:16px}
    p{color:#9fb3c8;line-height:1.6;margin-bottom:24px}
    a{color:#fbbf24;text-decoration:none}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"/></svg></div>
    <h1>${heading}</h1>
    <p>${message}</p>
    <p><a href="${SITE_URL}">Return to patriot-ops.com</a></p>
  </div>
</body>
</html>`
}

function successHtml() {
  return page(
    'Unsubscribed',
    '#22c55e',
    'M5 13l4 4L19 7',
    "You've been unsubscribed",
    "You will no longer receive emails from the Patriot Ops Center waitlist. We're sorry to see you go."
  )
}

function errorHtml(message: string) {
  return page(
    'Error',
    '#ef4444',
    'M6 18L18 6M6 6l12 12',
    'Something went wrong',
    `${message}. Please try again or contact support.`
  )
}
