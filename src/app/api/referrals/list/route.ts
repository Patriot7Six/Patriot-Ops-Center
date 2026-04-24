// src/app/api/referrals/list/route.ts
// Veteran-facing: list the caller's own referral cases.
// RLS restricts the query to auth.uid() = veteran_user_id so we don't need
// an explicit where clause here — but we add one for clarity and index use.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('referral_cases')
    .select('*')
    .eq('veteran_user_id', user.id)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('GET /api/referrals/list:', error)
    return NextResponse.json({ error: 'Failed to load cases' }, { status: 500 })
  }

  return NextResponse.json({ cases: data ?? [] })
}
