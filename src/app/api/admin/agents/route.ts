// src/app/api/admin/agents/route.ts
// Admin moderation endpoint for pending agent applications.
//
// Authorization: limited to users whose email is listed in the
// ADMIN_EMAILS env var (comma-separated). Not glamorous but sufficient until
// we have a real admin role. Sprint 10+ can swap this for a proper admin
// permissions system.
//
// GET   ?status=pending_verification → list pending agents
// PATCH  body: { agent_id, action: 'verify' | 'reject' | 'suspend', notes? }

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Agent, AgentStatus } from '@/types/database'

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

async function assertAdmin(): Promise<{ ok: true; email: string; userId: string } | { ok: false; status: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { ok: false, status: 401 }

  const admins = getAdminEmails()
  if (admins.length === 0) return { ok: false, status: 500 } // misconfigured
  if (!admins.includes(user.email.toLowerCase())) return { ok: false, status: 403 }

  return { ok: true, email: user.email, userId: user.id }
}

export async function GET(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin.ok) return NextResponse.json({ error: 'forbidden' }, { status: admin.status })

  const status = (req.nextUrl.searchParams.get('status') ?? 'pending_verification') as AgentStatus

  const service = await createServiceClient()
  const { data, error } = await service
    .from('agents')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ agents: data ?? [] })
}

interface PatchPayload {
  agent_id: string
  action:   'verify' | 'reject' | 'suspend'
  notes?:   string
}

export async function PATCH(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin.ok) return NextResponse.json({ error: 'forbidden' }, { status: admin.status })

  const body = (await req.json()) as Partial<PatchPayload>
  if (!body.agent_id || !body.action) {
    return NextResponse.json({ error: 'agent_id and action required' }, { status: 400 })
  }

  const nextStatus: AgentStatus =
    body.action === 'verify'  ? 'verified'
  : body.action === 'reject'  ? 'rejected'
  : body.action === 'suspend' ? 'suspended'
  : 'pending_verification'

  const now = new Date().toISOString()
  const update: Partial<Agent> = {
    status: nextStatus,
    admin_notes: body.notes ?? null,
  }
  if (body.action === 'verify') {
    update.verified_at = now
    update.verification_source = 'admin_manual'
  }

  const service = await createServiceClient()
  const { data, error } = await service
    .from('agents')
    .update(update)
    .eq('id', body.agent_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ agent: data })
}
