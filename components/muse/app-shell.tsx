'use client'

import { useEffect, useState } from 'react'
import { Header } from './header'
import { BottomDock } from './bottom-dock'
import { CaptureModal } from './capture-modal'
import { DocumentUpload } from './document-upload'
import { SearchBar } from './search-bar'
import { ReportsTab } from './reports-tab'
import { UpcomingReminders } from './upcoming-reminders'
import { AiAssistantModal } from './ai-assistant-modal'

type Theme = 'dark' | 'light'

export function AppShell() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [activeTab, setActiveTab] = useState('home')
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [startWithVoice, setStartWithVoice] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onOpenAI={() => setIsAIModalOpen(true)}
        onAskAI={(q) => {
          setInitialQuery(q)
          setStartWithVoice(false)
          setIsAIModalOpen(true)
        }}
      />

      <main className="flex-1 space-y-6 px-4 pb-36 pt-4">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UpcomingReminders />
            <DocumentUpload />
          </div>
        )}
        {activeTab === 'reports' && <ReportsTab />}
      </main>

      <AiAssistantModal 
        isOpen={isAIModalOpen} 
        startWithVoice={startWithVoice}
        initialQuery={initialQuery}
        onClose={() => {
          setIsAIModalOpen(false)
          setInitialQuery('') // Reset query on close
        }} 
      />

      <BottomDock
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenVoice={() => {
          setStartWithVoice(true)
          setIsAIModalOpen(true)
        }}
        onCapture={() => setCapturing(true)}
      />

      {capturing && <CaptureModal onClose={() => setCapturing(false)} />}
    </div>
  )
}
