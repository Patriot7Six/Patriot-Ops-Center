// src/lib/resend-audiences.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Audience ID created in Resend Dashboard → Audiences → "Launch Waitlist"
// Add RESEND_AUDIENCE_ID to Doppler after creating the audience.
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID!

/**
 * Add a contact to the Resend audience.
 * Call after successful signup to keep the audience in sync.
 */
export async function addToAudience(params: {
  email: string
  firstName?: string
  lastName?: string
}) {
  return resend.contacts.create({
    audienceId: AUDIENCE_ID,
    email: params.email,
    firstName: params.firstName,
    lastName: params.lastName,
    unsubscribed: false,
  })
}

/**
 * Remove a contact from the audience.
 * Call when a user deletes their account.
 */
export async function removeFromAudience(email: string) {
  // First find contact by email to get their ID
  const { data: contacts } = await resend.contacts.list({ audienceId: AUDIENCE_ID })
  const contact = contacts?.data?.find(c => c.email === email)
  if (!contact) return

  return resend.contacts.remove({
    audienceId: AUDIENCE_ID,
    id: contact.id,
  })
}

/**
 * Mark a contact as unsubscribed (soft remove — keeps the record).
 */
export async function unsubscribeFromAudience(email: string) {
  const { data: contacts } = await resend.contacts.list({ audienceId: AUDIENCE_ID })
  const contact = contacts?.data?.find(c => c.email === email)
  if (!contact) return

  return resend.contacts.update({
    audienceId: AUDIENCE_ID,
    id: contact.id,
    unsubscribed: true,
  })
}

/**
 * Send the launch announcement to the entire audience.
 * Only callable from the admin API route with ADMIN_SECRET.
 */
export async function sendLaunchAnnouncement() {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://patriot-ops.com'

  return resend.broadcasts.create({
    audienceId: AUDIENCE_ID,
    from: 'Patriot Ops Center <no-reply@email.patriot-ops.com>',
    subject: 'Patriot Ops Center is live — your free account is waiting',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
      <body style="margin:0;padding:0;background:#0a1929;font-family:ui-sans-serif,system-ui,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 16px;">
              <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:32px;text-align:center;">
                    <span style="background:#f59e0b;display:inline-block;width:32px;height:32px;border-radius:8px;"></span>
                    <span style="color:#fff;font-size:14px;font-weight:700;vertical-align:middle;margin-left:10px;">Patriot Ops Center</span>
                  </td>
                </tr>
                <tr>
                  <td style="background:#0d2137;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:40px 36px;">
                    <h1 style="color:#f59e0b;font-size:24px;font-weight:800;margin:0 0 16px;">We're live.</h1>
                    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px;">
                      You signed up to hear when Patriot Ops Center launched. That day is today.
                    </p>
                    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px;">
                      The full platform is now live at <strong style="color:#fff;">patriot-ops.com</strong> — AI-powered VA eligibility checking, claims guidance, document management, and career transition tools. All free to start.
                    </p>
                    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px;">
                      Your free account is waiting. It takes under 2 minutes to set up your military profile and see which benefits apply to your specific service history.
                    </p>
                    <a href="${APP_URL}/signup" style="display:inline-block;background:#f59e0b;color:#0a1929;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;">
                      Claim Your Free Account →
                    </a>
                    <p style="color:#475569;font-size:12px;margin:32px 0 0;">
                      You signed up to be notified about Patriot Ops Center. 
                      <a href="${APP_URL}/unsubscribe" style="color:#475569;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px;text-align:center;">
                    <p style="color:#334155;font-size:11px;margin:0;">
                      © ${new Date().getFullYear()} Patriot Ops Center · Not affiliated with the U.S. Department of Veterans Affairs
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  })
}
