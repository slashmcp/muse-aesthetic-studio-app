'use client'

import { Home, PieChart, Mic, Camera, Settings } from 'lucide-react'

export function BottomDock({
  activeTab,
  onTabChange,
  onOpenVoice,
}: {
  activeTab: string
  onTabChange: (t: string) => void
  onOpenVoice: () => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-5">
      <nav className="pointer-events-auto relative flex items-center justify-between rounded-3xl border border-border bg-card/90 px-3 py-2.5 shadow-soft backdrop-blur-xl">
        <DockButton
          icon={Home}
          label="Home"
          active={activeTab === 'home'}
          onClick={() => onTabChange('home')}
        />
        <DockButton
          icon={PieChart}
          label="Reports"
          active={activeTab === 'reports'}
          onClick={() => onTabChange('reports')}
        />

        {/* Central elevated camera FAB */}
        <div className="relative -mt-10 flex flex-col items-center">
          <button
            type="button"
            aria-label="Capture a receipt"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-4 ring-background transition active:scale-95"
          >
            <Camera className="h-6 w-6" />
          </button>
          <span className="mt-1 text-[10px] font-semibold text-muted-foreground">
            Capture
          </span>
        </div>

        <DockButton
          icon={Mic}
          label="Voice"
          active={false}
          onClick={onOpenVoice}
        />
        <DockButton
          icon={Settings}
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => onTabChange('settings')}
        />
      </nav>
    </div>
  )
}

function DockButton({
  icon: Icon,
  label,
  active,
  highlight,
  onClick,
}: {
  icon: typeof Home
  label: string
  active?: boolean
  highlight?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-14 flex-col items-center gap-1 py-1 transition active:scale-95"
    >
      <Icon
        className={`h-5 w-5 transition-colors ${
          highlight
            ? 'text-gold'
            : active
              ? 'text-foreground'
              : 'text-muted-foreground'
        }`}
      />
      <span
        className={`text-[10px] font-medium transition-colors ${
          active ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
