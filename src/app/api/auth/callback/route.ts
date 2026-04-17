import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // First-login detection: a profile row is auto-created by the Supabase trigger,
  // but `welcomed_at` is null until we fire the welcome email. This makes the
  // welcome job idempotent regardless of how many times the user logs in.
  try {
    const service = await createServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('id, full_name, welcomed_at, onboarded')
      .eq('id', data.user.id)
      .single()

    if (profile && !profile.welcomed_at) {
      const { sendWelcomeEmailJob, onboardingNudgeJob } = await import(
        '../../../../../trigger/jobs/emails'
      )

      await Promise.all([
        sendWelcomeEmailJob.trigger({
          userId: data.user.id,
          email: data.user.email ?? '',
          fullName: profile.full_name ?? '',
        }),
        // Only schedule the 24-hour nudge if they haven't already onboarded
        profile.onboarded
          ? Promise.resolve(null)
          : onboardingNudgeJob.trigger({
              userId: data.user.id,
              email: data.user.email ?? '',
              fullName: profile.full_name ?? '',
            }),
      ])

      await service
        .from('profiles')
        .update({ welcomed_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }
  } catch (triggerErr) {
    // Never block login on a trigger failure — Sentry captures this
    console.error('Welcome trigger failed:', triggerErr)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
