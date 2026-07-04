'use client'

import { useState } from 'react'
import { CalendarDays, X, Bell } from 'lucide-react'

// Real upcoming events in the aesthetics industry
const UPCOMING_EVENTS = [
  {
    id: 1,
    title: 'IECSC New York 2027',
    date: 'Mar 7, 2027',
    type: 'conferences',
    daysAway: 247,
    url: 'https://www.iecsc.com/'
  },
  {
    id: 2,
    title: 'The Aesthetic Show (Las Vegas)',
    date: 'Jul 8, 2027',
    type: 'conferences',
    daysAway: 370,
    url: 'https://www.aestheticshow.com/'
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
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Upcoming Industry Events</h3>
      </div>

      <div className="space-y-3">
        {UPCOMING_EVENTS.map(event => (
          <div key={event.id} className="flex items-start gap-3 bg-background/50 p-3 rounded-lg border border-border/50">
            <div className="bg-card p-2 rounded-md shadow-sm border border-border">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <a 
                href={event.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground truncate hover:text-gold transition-colors inline-block"
              >
                {event.title}
              </a>
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

