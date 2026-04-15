import { redirect } from 'next/navigation'
import type { ReactNode } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <div className="min-h-screen bg-navy-950 flex">
      <DashboardSidebar profile={profile} subscription={subscription} />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
