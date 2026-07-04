'use client'

import { Home, Mic, PieChart, Settings, Camera, FileText } from 'lucide-react'
import { useState, useRef } from 'react'
import { CaptureModal } from './capture-modal'

export function BottomDock({
  activeTab,
  onTabChange,
  onOpenVoice,
}: {
  activeTab: string
  onTabChange: (t: string) => void
  onOpenVoice: () => void
}) {
  const [showCapture, setShowCapture] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCaptureClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setShowCapture(true)
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-5">
        <nav className="pointer-events-auto relative flex items-center justify-between rounded-3xl border border-border bg-card/90 px-3 py-2.5 shadow-soft backdrop-blur-xl">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <DockButton
            icon={Home}
            label="Home"
            active={activeTab === 'home'}
            onClick={() => onTabChange('home')}
          />
          <DockButton
            icon={FileText}
            label="Ledger"
            active={activeTab === 'ledger'}
            onClick={() => onTabChange('ledger')}
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
              onClick={handleCaptureClick}
              aria-label="Capture a receipt"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-4 ring-background transition active:scale-95"
            >
              <Camera className="h-6 w-6" />
            </button>
            <span className="mt-1 text-[10px] font-semibold text-muted-foreground">
              Capture
            </span>
          </div>
        </nav>
      </div>

      {showCapture && selectedFile && (
        <CaptureModal
          file={selectedFile}
          onClose={() => {
            setShowCapture(false)
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
      )}
    </>
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
