'use client'

import { useEffect, useState } from 'react'
import { Header } from './header'
import { BottomDock } from './bottom-dock'
import { VoiceOverlay } from './voice-overlay'
import { CaptureModal } from './capture-modal'
import { DocumentUpload } from './document-upload'
import { SearchBar } from './search-bar'
import { ReportsTab } from './reports-tab'
import { UpcomingReminders } from './upcoming-reminders'

type Theme = 'dark' | 'light'

export function AppShell() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [listening, setListening] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [activeTab, setActiveTab] = useState('home')

  // Sync theme class on <html> so the whole UI shifts palettes.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
  }, [theme])

  const toggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background text-foreground">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="flex-1 space-y-6 px-4 pb-36 pt-4">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UpcomingReminders />
            <DocumentUpload />
            <SearchBar />
          </div>
        )}
        {activeTab === 'reports' && <ReportsTab />}
      </main>

      <BottomDock
        activeTab={activeTab}
        onTab={setActiveTab}
        onMic={() => setListening(true)}
        onCapture={() => setCapturing(true)}
        listening={listening}
      />

      {listening && <VoiceOverlay onClose={() => setListening(false)} />}
      {capturing && <CaptureModal onClose={() => setCapturing(false)} />}
    </div>
  )
}
