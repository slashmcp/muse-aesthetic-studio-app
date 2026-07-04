'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, X, Bell, Package, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Reminder = {
  id: string
  title: string
  due_date: string | null
  type: string
  created_at: string
}

export function UpcomingReminders() {
  const [isVisible, setIsVisible] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReminders()

    // Setup realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, () => {
        fetchReminders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchReminders = async () => {
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true })
      .limit(5)
    
    if (data) setReminders(data)
    setLoading(false)
  }

  const handleDismiss = async (id: string) => {
    // Optimistic update
    setReminders(prev => prev.filter(r => r.id !== id))
    await supabase.from('reminders').delete().eq('id', id)
  }

  if (!isVisible || (reminders.length === 0 && !loading)) return null

  return (
    <div className="w-full max-w-xl mx-auto p-4 mb-6 bg-gold/10 border border-gold/20 rounded-xl relative shadow-soft animate-in fade-in slide-in-from-top-4">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-gold hover:text-gold-soft transition"
        aria-label="Hide reminders section"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-semibold text-foreground tracking-tight">Upcoming Reminders</h3>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground animate-pulse">Loading reminders...</div>
        ) : reminders.map(reminder => {
          let daysAway = null
          if (reminder.due_date) {
             const due = new Date(reminder.due_date)
             const today = new Date()
             daysAway = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          }
          
          const Icon = reminder.type === 'inventory' ? Package : (reminder.type === 'event' ? CalendarDays : Info)

          return (
            <div key={reminder.id} className="flex items-start gap-3 bg-background/50 p-3 rounded-lg border border-border/50 group relative pr-10">
              <div className="bg-card p-2 rounded-md shadow-sm border border-border">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">
                  {reminder.title}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {reminder.due_date && (
                    <span className="text-xs text-muted-foreground">
                      Due: {new Date(reminder.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {daysAway !== null && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${daysAway <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-gold/10 text-gold'}`}>
                      {daysAway < 0 ? `${Math.abs(daysAway)} days overdue` : (daysAway === 0 ? 'Due today' : `In ${daysAway} days`)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDismiss(reminder.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded-md transition-all text-muted-foreground hover:text-foreground"
                title="Mark as done"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
