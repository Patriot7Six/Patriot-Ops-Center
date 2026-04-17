'use client'
// src/components/AmplitudeProvider.tsx
// Wraps the app to initialize Amplitude once on the client.
// Must be a Client Component so it can run in the browser.
import { useEffect } from 'react'
import { initAmplitude } from '@/lib/amplitude'

export function AmplitudeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAmplitude()
  }, [])

  return <>{children}</>
}
