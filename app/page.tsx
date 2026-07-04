'use client'

import { useState } from 'react'
import { AppShell } from '@/components/muse/app-shell'
import { PinGate } from '@/components/muse/pin-gate'
import { SplashScreen } from '@/components/muse/splash-screen'

export default function Page() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <div className="min-h-dvh bg-background-2">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <PinGate>
        <AppShell />
      </PinGate>
    </div>
  )
}

