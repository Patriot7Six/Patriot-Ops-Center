// trigger/jobs/digest.ts
import { schedules } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import { getResend } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beta.patriot-ops.com'
const FROM = 'Patriot Ops Center <no-reply@email.patriot-ops.com>'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Weekly benefits digest — every Monday at 8am UTC ─────────────────────────
// Sends a curated "benefits tip of the week" to all active users
// who have completed onboarding. Keeps users engaged and coming back.
export const weeklyBenefitsDigestJob = schedules.task({
  id: 'weekly-benefits-digest',
  cron: '0 8 * * 1',
  run: async () => {
    // Get all onboarded users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, branch')
      .eq('onboarded', true)

    if (!profiles?.length) return { sent: 0 }

    // Pick this week's tip — rotate through a set of evergreen tips
    const tips = [
      {
        title: 'Did you know? TDIU can get you 100% pay at a lower rating.',
        body: 'Total Disability based on Individual Unemployability (TDIU) pays you at the 100% rate even if your combined rating is lower — as long as your service-connected disabilities prevent you from substantially gainful employment.',
        cta: 'Check Your TDIU Eligibility',
        href: `${APP_URL}/benefits/eligibility`,
      },
      {
        title: 'The VA Buddy Statement is one of the most underused claim tools.',
        body: 'A buddy statement (VA Form 21-10210) lets fellow veterans or family members corroborate your condition and its impact. It costs nothing and can be the difference between approval and denial.',
        cta: 'Get Help With Your Claim',
        href: `${APP_URL}/benefits/claims`,
      },
      {
        title: 'Your GI Bill benefits expire 15 years after discharge.',
        body: 'Post-9/11 GI Bill (Chapter 33) benefits must be used within 15 years of your last period of qualifying active duty. Don\'t let them expire unused.',
        cta: 'Explore Education Benefits',
        href: `${APP_URL}/benefits`,
      },
      {
        title: 'VA home loans have no down payment and no PMI — ever.',
        body: 'The VA home loan benefit is one of the most valuable you\'ve earned. No down payment, no private mortgage insurance, and competitive rates. You can use it multiple times.',
        cta: 'Learn About VA Home Loans',
        href: `${APP_URL}/benefits`,
      },
    ]

    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    const tip = tips[weekNumber % tips.length]

    let sent = 0
    let skipped = 0

    for (const profile of profiles) {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
      if (!user?.email) { skipped++; continue }

      const firstName = profile.full_name?.split(' ')[0] ?? 'Veteran'

      await getResend().emails.send({
        from: FROM,
        to: user.email,
        subject: `Weekly tip: ${tip.title}`,
        html: `
          <div style="font-family:sans-serif;background:#0a1929;padding:40px;max-width:520px;margin:0 auto;border-radius:16px;border:1px solid rgba(255,255,255,0.07);">
            <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Patriot Ops Center · Weekly Tip</p>
            <h2 style="color:#f59e0b;font-size:18px;line-height:1.3;margin-bottom:16px;">${tip.title}</h2>
            <p style="color:#94a3b8;line-height:1.7;margin-bottom:24px;">${tip.body}</p>
            <a href="${tip.href}" style="display:inline-block;background:#f59e0b;color:#0a1929;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;">${tip.cta} →</a>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0;" />
            <p style="color:#334155;font-size:11px;">You're receiving this because you have an account at Patriot Ops Center. <a href="${APP_URL}/dashboard" style="color:#475569;">Unsubscribe</a></p>
          </div>
        `,
      })
      sent++
    }

    return { sent, skipped, tip: tip.title }
  },
})
