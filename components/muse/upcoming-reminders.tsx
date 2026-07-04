'use client'

import { useState } from 'react'
import { CalendarDays, X, Bell } from 'lucide-react'

// Placeholder data for upcoming events
const UPCOMING_EVENTS = [
  {
    id: 1,
    title: 'Aesthetics Tech Summit 2026',
    date: 'Oct 12, 2026',
    type: 'conferences',
    daysAway: 45,
  },
  {
    id: 2,
    title: 'Q3 Estimated Tax Payment',
    date: 'Sep 15, 2026',
    type: 'taxes',
    daysAway: 18,
  }
]

export function UpcomingReminders() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="w-full max-w-xl mx-auto p-4 mb-6 bg-gold/10 border border-gold/20 rounded-xl relative shadow-soft animate-in fade-in slide-in-from-top-4">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-gold hover:text-gold-soft transition"
        aria-label="Dismiss reminders"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Upcoming Reminders</h3>
      </div>

      <div className="space-y-3">
        {UPCOMING_EVENTS.map(event => (
          <div key={event.id} className="flex items-start gap-3 bg-background/50 p-3 rounded-lg border border-border/50">
            <div className="bg-card p-2 rounded-md shadow-sm border border-border">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{event.date}</span>
                <span className="text-[10px] font-semibold text-gold px-1.5 py-0.5 rounded-full bg-gold/10">
                  In {event.daysAway} days
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
