'use client'

import { useState } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CalendarClock,
  Check,
} from 'lucide-react'

type Insight = {
  id: string
  icon: typeof AlertTriangle
  tone: 'alert' | 'info' | 'positive'
  title: string
  body: string
  primary: string
  secondary: string
}

const INSIGHTS: Insight[] = [
  {
    id: 'anomaly',
    icon: AlertTriangle,
    tone: 'alert',
    title: 'Price Anomaly Alert',
    body: 'Vitamin C serum cost increased 14% versus your last Skin Script order. This affects your projected backbar spend.',
    primary: 'Adjust Projections',
    secondary: 'Review Supplier',
  },
  {
    id: 'reorder',
    icon: CalendarClock,
    tone: 'info',
    title: 'Reorder Predicted',
    body: 'At current usage, Pomegranate Enzyme runs out in ~9 days. Bundle it with cotton rounds to save on shipping.',
    primary: 'Draft Order',
    secondary: 'Snooze',
  },
  {
    id: 'save',
    icon: TrendingUp,
    tone: 'positive',
    title: "You're Trending Under",
    body: 'Marketing spend is 22% below last month while bookings held steady — a strong efficiency signal.',
    primary: 'See Breakdown',
    secondary: 'Dismiss',
  },
]

const TONE: Record<
  Insight['tone'],
  { ring: string; iconWrap: string; iconColor: string; badge: string }
> = {
  alert: {
    ring: 'border-destructive/40',
    iconWrap: 'bg-destructive/12',
    iconColor: 'text-destructive',
    badge: 'bg-destructive/12 text-destructive',
  },
  info: {
    ring: 'border-border',
    iconWrap: 'bg-accent',
    iconColor: 'text-gold',
    badge: 'bg-accent text-accent-foreground',
  },
  positive: {
    ring: 'border-sage/40',
    iconWrap: 'bg-sage/15',
    iconColor: 'text-sage',
    badge: 'bg-sage/15 text-sage',
  },
}

export function AgentStream() {
  return (
    <section aria-labelledby="agent-heading" className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-gold" />
        <h2
          id="agent-heading"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Proactive Insights
        </h2>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {INSIGHTS.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const [resolved, setResolved] = useState(false)
  const t = TONE[insight.tone]
  const Icon = insight.icon

  return (
    <article
      className={`relative w-[86%] shrink-0 snap-center overflow-hidden rounded-2xl border bg-card p-4 shadow-soft ${t.ring}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.iconWrap}`}
        >
          <Icon className={`h-[18px] w-[18px] ${t.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight text-foreground">
            {insight.title}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            {insight.body}
          </p>
        </div>
      </div>

      {resolved ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-sage/15 py-2.5 text-xs font-semibold text-sage">
          <Check className="h-4 w-4" />
          Handled by Muse AI
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setResolved(true)}
            className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition active:scale-[0.98]"
          >
            {insight.primary}
          </button>
          <button
            type="button"
            onClick={() => setResolved(true)}
            className="flex-1 rounded-xl border border-border bg-background-2 py-2.5 text-xs font-semibold text-foreground transition active:scale-[0.98]"
          >
            {insight.secondary}
          </button>
        </div>
      )}
    </article>
  )
}
