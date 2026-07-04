'use client'

import Image from 'next/image'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { SearchBar } from './search-bar'

export function Header({
  theme,
  onToggleTheme,
  onOpenAI,
  onAskAI,
}: {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenAI?: () => void
  onAskAI?: (query: string) => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-border">
            <Image
              src="https://muse2025.s3.us-east-1.amazonaws.com/Copy+of+Copy+of+Grey+and+Black+Minimalist+Simple+Modern+Gaze+Creative+Studio+Logo+(1).png"
              alt="Muse Aesthetic Studio logo"
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-lg font-semibold tracking-tight text-foreground">
              Muse Aesthetic Studio
            </p>
            <button 
              onClick={onOpenAI}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-softpulse absolute inline-flex h-full w-full rounded-full bg-sage" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage" />
              </span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                AI Agent · Active
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-gold xs:flex">
            <Sparkles className="h-3 w-3" />
            Muse AI
          </span>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-soft transition-colors hover:border-gold/60 active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px] text-gold" />
            ) : (
              <Moon className="h-[18px] w-[18px] text-gold" />
            )}
          </button>
        </div>
      </div>
      <div className="px-4 pb-3">
        <SearchBar onAskAI={onAskAI} />
      </div>
    </header>
  )
}
