// trigger/jobs/subscriptions.ts
import { task, wait, schedules } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import { getResend } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com'
const FROM = 'Patriot Ops Center <no-reply@email.patriot-ops.com>'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Renewal reminder — fires 3 days before subscription renews ────────────────
// Triggered from the Stripe webhook when subscription.updated fires
// with a current_period_end approaching within 3 days.
export const renewalReminderJob = task({
  id: 'subscription-renewal-reminder',
  run: async (payload: {
    userId: string
    email: string
    fullName: string
    tier: string
    renewalDate: string   // ISO string
    amountUsd: number
  }) => {
    const firstName = payload.fullName?.split(' ')[0] ?? 'Veteran'
    const planName = 'Special Ops'
    const renewal = new Date(payload.renewalDate).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })

    await getResend().emails.send({
      from: FROM,
      to: payload.email,
      subject: `Your ${planName} plan renews in 3 days`,
      html: `
        <div style="font-family:sans-serif;background:#0a1929;padding:40px;max-width:520px;margin:0 auto;border-radius:16px;border:1px solid rgba(255,255,255,0.07);">
          <h2 style="color:#f59e0b;margin-bottom:12px;">Renewal reminder, ${firstName}.</h2>
          <p style="color:#94a3b8;line-height:1.6;">Your <strong style="color:#fff;">${planName}</strong> plan will automatically renew on <strong style="color:#f59e0b;">${renewal}</strong> for $${payload.amountUsd}/month.</p>
          <p style="color:#94a3b8;line-height:1.6;">If you'd like to make changes to your subscription, visit your billing page before then.</p>
          <a href="${APP_URL}/dashboard/billing" style="display:inline-block;background:#f59e0b;color:#0a1929;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;margin-top:16px;">Manage Subscription →</a>
        </div>
      `,
    })

    return { sent: true }
  },
})

// ── Cancellation follow-up — fires 1 day after subscription is canceled ───────
export const cancellationFollowUpJob = task({
  id: 'subscription-cancellation-followup',
  run: async (payload: {
    userId: string
    email: string
    fullName: string
    tier: string
    canceledAt: string
  }) => {
    // Wait 24 hours — give the user space before reaching out
    await wait.for({ hours: 24 })

    const firstName = payload.fullName?.split(' ')[0] ?? 'Veteran'
    const planName = 'Special Ops'

    await getResend().emails.send({
      from: FROM,
      to: payload.email,
      subject: `Your ${planName} plan has been canceled`,
      html: `
        <div style="font-family:sans-serif;background:#0a1929;padding:40px;max-width:520px;margin:0 auto;border-radius:16px;border:1px solid rgba(255,255,255,0.07);">
          <h2 style="color:#fff;margin-bottom:12px;">We're sorry to see you go, ${firstName}.</h2>
          <p style="color:#94a3b8;line-height:1.6;">Your <strong style="color:#fff;">${planName}</strong> subscription has been canceled. You'll retain access until the end of your billing period.</p>
          <p style="color:#94a3b8;line-height:1.6;">If there was something we could have done better, just reply to this email — we read every response.</p>
          <p style="color:#94a3b8;line-height:1.6;">Your account and free-tier access remain active. You can reactivate anytime.</p>
          <a href="${APP_URL}/dashboard/billing" style="display:inline-block;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;margin-top:16px;">Reactivate Plan →</a>
        </div>
      `,
    })

    return { sent: true }
  },
})

// ── Failed payment dunning — retry sequence over 7 days ──────────────────────
// Triggered when invoice.payment_failed fires from Stripe.
// Stripe itself will retry the charge — this job handles communication.
export const failedPaymentDunningJob = task({
  id: 'failed-payment-dunning',
  run: async (payload: {
    userId: string
    email: string
    fullName: string
    tier: string
    attemptNumber: 1 | 2 | 3
  }) => {
    const firstName = payload.fullName?.split(' ')[0] ?? 'Veteran'
    const planName = 'Special Ops'

    const subject = payload.attemptNumber === 1
      ? `Action needed: payment failed for your ${planName} plan`
      : payload.attemptNumber === 2
      ? `Second notice: please update your payment method`
      : `Final notice: your ${planName} plan will be canceled`

    const urgency = payload.attemptNumber === 3
      ? `<p style="color:#f87171;font-weight:600;">This is your final notice. If payment is not resolved, your subscription will be canceled.</p>`
      : ''

    await getResend().emails.send({
      from: FROM,
      to: payload.email,
      subject,
      html: `
        <div style="font-family:sans-serif;background:#0a1929;padding:40px;max-width:520px;margin:0 auto;border-radius:16px;border:1px solid rgba(248,113,113,0.2);">
          <h2 style="color:#f87171;margin-bottom:12px;">Payment failed, ${firstName}.</h2>
          <p style="color:#94a3b8;line-height:1.6;">We weren't able to process your payment for the <strong style="color:#fff;">${planName}</strong> plan. This is attempt ${payload.attemptNumber} of 3.</p>
          ${urgency}
          <p style="color:#94a3b8;line-height:1.6;">Please update your payment method to keep your subscription active.</p>
          <a href="${APP_URL}/dashboard/billing" style="display:inline-block;background:#f59e0b;color:#0a1929;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;margin-top:16px;">Update Payment Method →</a>
        </div>
      `,
    })

    return { sent: true, attempt: payload.attemptNumber }
  },
})

// ── Scheduled: find subscriptions expiring in 3 days and trigger reminders ───
export const findExpiringSubscriptionsJob = schedules.task({
  id: 'find-expiring-subscriptions',
  // Run daily at 10am UTC
  cron: '0 10 * * *',
  run: async () => {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const dayStart = new Date(threeDaysFromNow)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(threeDaysFromNow)
    dayEnd.setHours(23, 59, 59, 999)

    const { data: expiring } = await supabase
      .from('subscriptions')
      .select('user_id, tier, current_period_end')
      .neq('tier', 'free')
      .eq('status', 'active')
      .eq('cancel_at_period_end', false)
      .gte('current_period_end', dayStart.toISOString())
      .lte('current_period_end', dayEnd.toISOString())

    if (!expiring?.length) return { triggered: 0 }

    let triggered = 0
    for (const sub of expiring) {
      const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sub.user_id)
        .single()

      if (user?.email) {
        const amount = sub.tier === 'elite' ? 124 : 34
        await renewalReminderJob.trigger({
          userId: sub.user_id,
          email: user.email,
          fullName: profile?.full_name ?? '',
          tier: sub.tier,
          renewalDate: sub.current_period_end,
          amountUsd: amount,
        })
        triggered++
      }
    }

    return { triggered }
  },
})
