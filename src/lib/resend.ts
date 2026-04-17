import { Resend } from 'resend'

let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(key)
  }
  return _resend
}

// Resend verified sending domain is email.patriot-ops.com
// Verify this subdomain in Resend dashboard → Domains → Add domain → email.patriot-ops.com
const FROM = 'Patriot Ops Center <no-reply@email.patriot-ops.com>'

// Beta:       https://beta.patriot-ops.com  (current)
// Production: https://patriot-ops.com        (set NEXT_PUBLIC_APP_URL in Vercel when launching)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com'

// ── Shared layout helpers ─────────────────────────────────────────────────────
function layout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Patriot Ops Center</title>
</head>
<body style="margin:0;padding:0;background:#0a1929;font-family:ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:32px;height:32px;background:#f59e0b;border-radius:8px;display:inline-block;"></div>
                <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:-0.01em;">Patriot Ops Center</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#0d2137;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:40px 36px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="color:#475569;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} Patriot Ops Center · Not affiliated with the U.S. Department of Veterans Affairs
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const h1 = (t: string) => `<h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 12px;line-height:1.3;">${t}</h1>`
const p  = (t: string) => `<p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">${t}</p>`
const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#f59e0b;color:#0a1929;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;text-decoration:none;margin:8px 0 24px;">${label}</a>`

// ── Email senders ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Patriot Ops Center',
    html: layout(`
      ${h1(`Welcome, ${firstName}. Your mission starts here.`)}
      ${p('You\'ve joined thousands of veterans using Patriot Ops Center to navigate VA benefits, file stronger claims, and transition to civilian careers with confidence.')}
      ${p('Complete your military profile to unlock personalized benefit recommendations tailored to your branch, MOS, and service dates.')}
      ${btn(`${APP_URL}/onboarding`, 'Complete My Profile →')}
      ${p('Questions? Reply to this email — a real veteran advocate will respond within 24 hours.')}
    `),
  })
}

export async function sendMagicLinkEmail(to: string, magicLink: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Your Patriot Ops Center sign-in link',
    html: layout(`
      ${h1('Your secure sign-in link')}
      ${p('Click the button below to sign in to Patriot Ops Center. This link expires in 1 hour and can only be used once.')}
      ${btn(magicLink, 'Sign In Securely →')}
      ${p('If you didn\'t request this, you can safely ignore this email.')}
    `),
  })
}

export async function sendSubscriptionEmail(
  to: string,
  firstName: string,
  planName: string,
  nextBillingDate: string,
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `You're now on the ${planName} plan`,
    html: layout(`
      ${h1(`${firstName}, you're now on the ${planName} plan.`)}
      ${p(`Your subscription is active. Your next billing date is <strong style="color:#f59e0b;">${nextBillingDate}</strong>.`)}
      ${p(`All ${planName} features are now unlocked. Head to your dashboard to put them to work.`)}
      ${btn(`${APP_URL}/dashboard`, 'Go to Dashboard →')}
      ${p('To manage or cancel your subscription, visit your billing page at any time.')}
    `),
  })
}

export async function sendOnboardingCompleteEmail(to: string, firstName: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Your Patriot Ops profile is complete',
    html: layout(`
      ${h1(`Profile complete, ${firstName}.`)}
      ${p('Your military profile is set up. We\'ve analyzed your branch, MOS, and service dates to surface the benefits most likely to apply to you.')}
      ${p('Start with the VA Eligibility Checker to see what you qualify for — it takes about 3 minutes.')}
      ${btn(`${APP_URL}/dashboard`, 'View My Benefits →')}
    `),
  })
}
