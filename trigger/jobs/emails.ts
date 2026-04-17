// trigger/jobs/emails.ts
import { task, wait } from '@trigger.dev/sdk/v3'
import {
  sendWelcomeEmail,
  sendOnboardingCompleteEmail,
} from '@/lib/resend'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Welcome email — triggered after new user signup ───────────────────────────
export const sendWelcomeEmailJob = task({
  id: 'send-welcome-email',
  run: async (payload: { userId: string; email: string; fullName: string }) => {
    const firstName = payload.fullName?.split(' ')[0] ?? 'Veteran'
    await sendWelcomeEmail(payload.email, firstName)
    return { sent: true, email: payload.email }
  },
})

// ── Onboarding nudge — fires 24 hours after signup if not yet onboarded ───────
export const onboardingNudgeJob = task({
  id: 'onboarding-nudge',
  run: async (payload: { userId: string; email: string; fullName: string }) => {
    // Wait 24 hours before checking
    await wait.for({ hours: 24 })

    // Check if user has since completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', payload.userId)
      .single()

    if (profile?.onboarded) {
      return { skipped: true, reason: 'Already onboarded' }
    }

    // Send the nudge email
    const firstName = payload.fullName?.split(' ')[0] ?? 'Veteran'
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com'

    const { getResend } = await import('@/lib/resend')
    await getResend().emails.send({
      from: 'Patriot Ops Center <no-reply@email.patriot-ops.com>',
      to: payload.email,
      subject: `${firstName}, your benefits profile is waiting`,
      html: `
        <div style="font-family:sans-serif;background:#0a1929;color:#fff;padding:40px;max-width:520px;margin:0 auto;border-radius:16px;">
          <h2 style="color:#f59e0b;margin-bottom:12px;">Your profile is 3 minutes away.</h2>
          <p style="color:#94a3b8;line-height:1.6;">You signed up for Patriot Ops Center but haven't finished your military profile yet. Without it, we can't show you which VA benefits apply to your specific service history.</p>
          <p style="color:#94a3b8;line-height:1.6;">It takes about 3 minutes — just your branch, MOS, and separation date.</p>
          <a href="${APP_URL}/onboarding" style="display:inline-block;background:#f59e0b;color:#0a1929;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;margin-top:16px;">Complete My Profile →</a>
        </div>
      `,
    })

    return { sent: true, email: payload.email }
  },
})

// ── Onboarding complete email — triggered when profile is saved ───────────────
export const onboardingCompleteEmailJob = task({
  id: 'send-onboarding-complete-email',
  run: async (payload: { userId: string; email: string; fullName: string }) => {
    const firstName = payload.fullName?.split(' ')[0] ?? 'Veteran'
    await sendOnboardingCompleteEmail(payload.email, firstName)
    return { sent: true }
  },
})
