'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

export function PinGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const REQUIRED_PIN = '0096'

  useEffect(() => {
    // Check local storage on mount
    const savedPin = localStorage.getItem('muse_auth_pin')
    if (savedPin === REQUIRED_PIN) {
      setIsUnlocked(true)
    } else {
      setIsUnlocked(false)
    }
  }, [])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === REQUIRED_PIN) {
      localStorage.setItem('muse_auth_pin', REQUIRED_PIN)
      setIsUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  // Prevent hydration mismatch flashes by rendering nothing until client-side check is done
  if (isUnlocked === null) {
    return <div className="min-h-dvh bg-background-2 flex items-center justify-center" />
  }

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm p-8 bg-card border border-border rounded-2xl shadow-xl flex flex-col items-center space-y-6">
        <div className="h-16 w-16 bg-gold/10 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 text-gold" />
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Private Ledger</h1>
          <p className="text-muted-foreground text-sm">Enter your PIN to access Muse.</p>
        </div>

        <form onSubmit={handlePinSubmit} className="w-full space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setError(false)
              setPin(e.target.value)
              if (e.target.value.length === 4) {
                // Auto submit when 4 digits entered
                if (e.target.value === REQUIRED_PIN) {
                  localStorage.setItem('muse_auth_pin', REQUIRED_PIN)
                  setIsUnlocked(true)
                  setError(false)
                } else {
                  setError(true)
                  setPin('')
                }
              }
            }}
            placeholder="••••"
            className={`w-full text-center text-3xl tracking-[1em] py-4 bg-background-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold transition-colors ${
              error ? 'border-destructive text-destructive' : 'border-border'
            }`}
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive text-center animate-in fade-in slide-in-from-top-1">
              Incorrect PIN. Try again.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
