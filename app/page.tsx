import { AppShell } from '@/components/muse/app-shell'
import { PinGate } from '@/components/muse/pin-gate'

export default function Page() {
  return (
    <div className="min-h-dvh bg-background-2">
      <PinGate>
        <AppShell />
      </PinGate>
    </div>
  )
}

