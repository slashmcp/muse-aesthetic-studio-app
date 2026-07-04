'use client'

import { useEffect, useState } from 'react'
import { Mic, X, Check } from 'lucide-react'

const FULL_TRANSCRIPT = "Log $45 receipt for cotton rounds under backbar supplies"

const BARS = [0.4, 0.7, 1, 0.55, 0.85, 0.3, 0.9, 0.5, 0.75, 0.35, 0.95, 0.6, 0.45]

export function VoiceOverlay({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)

  // simulate speech-to-text streaming
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setTyped(FULL_TRANSCRIPT.slice(0, i))
      if (i >= FULL_TRANSCRIPT.length) {
        clearInterval(interval)
        setTimeout(() => setDone(true), 500)
      }
    }, 45)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col justify-end">
      <button
        type="button"
        aria-label="Close voice assistant"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      <div className="relative z-10 m-4 mb-24 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-softpulse absolute inline-flex h-full w-full rounded-full bg-destructive" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {done ? 'Captured' : 'Listening…'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background-2 text-muted-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Glowing audio wave */}
        <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-background-2 py-6">
          <div className="flex h-14 items-center gap-1.5">
            {BARS.map((h, i) => (
              <span
                key={i}
                className={`w-1.5 rounded-full ${done ? 'bg-sage' : 'bg-gold animate-wave'}`}
                style={{
                  height: `${h * 100}%`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Mock speech-to-text preview */}
        <div className="mt-4 rounded-2xl border border-border bg-background-2 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Transcript
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            &ldquo;{typed}
            {!done && <span className="animate-softpulse text-gold">|</span>}
            &rdquo;
          </p>
        </div>

        {done && (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              Confirm & Log
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Mic className="h-3 w-3" />
          Muse AI is parsing amount, vendor & category
        </div>
      </div>
    </div>
  )
}
