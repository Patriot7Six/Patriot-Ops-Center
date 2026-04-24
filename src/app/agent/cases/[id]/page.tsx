import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Agent, CaseEvent, ReferralCase } from '@/types/database'
import { AgentCaseActions } from '@/components/AgentCaseActions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AgentCaseDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/agent/dashboard')

  const { data: agentRow } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!agentRow) redirect('/agent/apply')
  const agent = agentRow as Agent

  const { data: kase } = await supabase
    .from('referral_cases')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!kase) notFound()
  const typedCase = kase as ReferralCase

  // RLS should've blocked unauthorized access, but double-check explicitly:
  // agent can see if (a) it's assigned to them or (b) it's open + in their states.
  const canView =
    typedCase.agent_id === agent.id ||
    (typedCase.status === 'open' && agent.practice_states.includes(typedCase.state))

  if (!canView) notFound()

  const { data: events } = await supabase
    .from('case_events')
    .select('*')
    .eq('case_id', id)
    .order('created_at', { ascending: false })

  const isMine = typedCase.agent_id === agent.id

  return (
    <main className="min-h-screen bg-navy-950 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/agent/cases" className="text-sm text-slate-400 hover:text-white inline-block">
          ← Back to cases
        </Link>

        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Case #{typedCase.id.slice(0, 8)}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{typedCase.state}</span>
                <span>·</span>
                <span className="capitalize">{typedCase.urgency ?? 'standard'}</span>
                <span>·</span>
                <span>Submitted {new Date(typedCase.submitted_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              {typeof typedCase.strength_score === 'number' && (
                <>
                  <p className="text-xs text-slate-500 mb-0.5">Strength score</p>
                  <p className="text-2xl font-extrabold text-gold-400">
                    {typedCase.strength_score}/100
                  </p>
                </>
              )}
            </div>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500 mb-1">Veteran&apos;s summary</dt>
              <dd className="text-slate-200 whitespace-pre-line">{typedCase.condition_summary}</dd>
            </div>
            {typedCase.denial_summary && (
              <div>
                <dt className="text-xs text-slate-500 mb-1">Denial summary</dt>
                <dd className="text-slate-200 whitespace-pre-line">{typedCase.denial_summary}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
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
            {typedCase.extra_notes && (
              <div>
                <dt className="text-xs text-slate-500 mb-1">Additional notes</dt>
                <dd className="text-slate-200 whitespace-pre-line">{typedCase.extra_notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Actions */}
        <AgentCaseActions caseId={typedCase.id} status={typedCase.status} isMine={isMine} />

        {/* Timeline */}
        <section className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Timeline
          </h2>
          <ol className="space-y-3">
            {(events as CaseEvent[] ?? []).map(e => (
              <li key={e.id} className="flex gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 shrink-0" />
                <div>
                  <p className="text-white capitalize">{e.event_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(e.created_at).toLocaleString()} · {e.actor_role}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}
