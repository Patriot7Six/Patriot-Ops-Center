import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { CaseEvent, ReferralCase } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  submitted: {
    title: 'In review',
    body:  'We\'re reviewing your case. You\'ll see it move to "Matching" once it\'s open to agents — usually within minutes.',
  },
  open: {
    title: 'Matching with agents',
    body:  'Your case is visible to VA-accredited agents in your state. You\'ll be notified the moment one accepts.',
  },
  accepted: {
    title: 'Agent assigned',
    body:  'A VA-accredited agent has accepted your case. They\'ll reach out directly with next steps.',
  },
  won: {
    title: 'Favorable decision',
    body:  'Your agent reported a favorable VA decision on this case. Congratulations.',
  },
  lost: {
    title: 'Unfavorable decision',
    body:  'The VA\'s decision was unfavorable on this attempt. Your agent may advise on next steps, including appeal options.',
  },
  withdrawn: {
    title: 'Withdrawn',
    body:  'This case is no longer active.',
  },
  expired: {
    title: 'Expired',
    body:  'No agent accepted this case within the 14-day window. You can resubmit with updated details — sometimes adding more context helps agents evaluate the case.',
  },
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: kase } = await supabase
    .from('referral_cases')
    .select('*')
    .eq('id', id)
    .eq('veteran_user_id', user.id)
    .maybeSingle()

  if (!kase) notFound()

  const { data: events } = await supabase
    .from('case_events')
    .select('*')
    .eq('case_id', id)
    .order('created_at', { ascending: false })

  const typedCase = kase as ReferralCase
  const typedEvents = (events ?? []) as CaseEvent[]
  const copy = STATUS_COPY[typedCase.status]

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-16 border-b border-white/[0.06] px-6 lg:px-8 flex items-center shrink-0">
        <Link href="/dashboard/referrals" className="text-sm text-slate-400 hover:text-white">
          ← All referrals
        </Link>
      </header>

      <div className="p-6 lg:p-8 max-w-3xl space-y-6">
        {/* Status banner */}
        <div className="rounded-2xl border border-gold-500/20 bg-gold-500/[0.04] p-6">
          <h1 className="text-xl font-bold text-white mb-1">{copy.title}</h1>
          <p className="text-sm text-slate-400">{copy.body}</p>
        </div>

        {/* Case details */}
        <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Your case
          </h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500 mb-1">Summary</dt>
              <dd className="text-slate-200 whitespace-pre-line">{typedCase.condition_summary}</dd>
            </div>
            {typedCase.denial_summary && (
              <div>
                <dt className="text-xs text-slate-500 mb-1">Denial summary</dt>
                <dd className="text-slate-200 whitespace-pre-line">{typedCase.denial_summary}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-slate-500 mb-1">State</dt>
                <dd className="text-slate-200">{typedCase.state}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-1">Urgency</dt>
                <dd className="text-slate-200 capitalize">{typedCase.urgency ?? 'standard'}</dd>
              </div>
              {typedCase.current_rating !== null && (
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Current rating</dt>
                  <dd className="text-slate-200">{typedCase.current_rating}%</dd>
                </div>
              )}
              {typedCase.requested_rating !== null && (
                <div>
                  <dt className="text-xs text-slate-500 mb-1">Target rating</dt>
                  <dd className="text-slate-200">{typedCase.requested_rating}%</dd>
                </div>
              )}
            </div>
            {typedCase.specialty_tags.length > 0 && (
              <div>
                <dt className="text-xs text-slate-500 mb-1">Specialties</dt>
                <dd className="flex flex-wrap gap-2 mt-1">
                  {typedCase.specialty_tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-slate-300">
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Timeline */}
        <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Timeline
          </h2>
          {typedEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No events yet.</p>
          ) : (
            <ol className="space-y-4">
              {typedEvents.map(e => (
                <li key={e.id} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-white capitalize">{e.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(e.created_at).toLocaleString()} · {e.actor_role}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
