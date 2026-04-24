'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agent } from '@/types/database'

interface UseAgentReturn {
  agent:     Agent | null
  isAgent:   boolean
  isVerified: boolean
  isLoading: boolean
}

export function useAgent(): UseAgentReturn {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (mounted) setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (mounted) {
        setAgent(data as Agent | null)
        setIsLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  return {
    agent,
    isAgent:    agent !== null,
    isVerified: agent?.status === 'verified',
    isLoading,
  }
}
