'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, Info } from 'lucide-react'
import {
  LEDGER,
  MONTHLY_BACKBAR_BUDGET,
  currency,
} from '@/lib/muse-data'

export function BudgetDashboard() {
  const spent = useMemo(
    () =>
      LEDGER.filter((e) => e.category === 'backbar').reduce(
        (sum, e) => sum + e.amount,
        0,
      ),
    [],
  )
  const remaining = Math.max(MONTHLY_BACKBAR_BUDGET - spent, 0)
  const pct = Math.min(spent / MONTHLY_BACKBAR_BUDGET, 1)

  // animate the ring on mount
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setProgress(pct), 150)
    return () => clearTimeout(t)
  }, [pct])

  const size = 200
  const stroke = 14
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * progress

  return (
    <section aria-labelledby="budget-heading">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-1 flex items-center justify-between">
          <h2
            id="budget-heading"
            className="text-[13px] font-medium leading-tight text-muted-foreground"
          >
            Remaining Monthly
            <br />
            Backbar Budget
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
            <Info className="h-3 w-3" />
            Not in Vagaro
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="-rotate-90"
              role="img"
              aria-label={`${Math.round(pct * 100)} percent of budget used`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="var(--gold)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ - dash}
                style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-4xl font-semibold tracking-tight text-foreground">
                {currency(remaining)}
              </span>
              <span className="mt-1 text-xs font-medium text-muted-foreground">
                of {currency(MONTHLY_BACKBAR_BUDGET)} left
              </span>
              <span className="mt-2 rounded-full bg-sage/15 px-2.5 py-0.5 text-[11px] font-semibold text-sage">
                {Math.round(pct * 100)}% used
              </span>
            </div>
          </div>
        </div>

        {/* Predictive trend */}
        <div className="mt-5 rounded-2xl border border-border bg-background-2 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              <span className="text-xs font-semibold text-foreground">
                Projected month-end
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground">
              {currency(1385)}
            </span>
          </div>
          <TrendLine />
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            On pace to finish{' '}
            <span className="font-semibold text-sage">
              {currency(115)} under budget
            </span>{' '}
            based on your last 3 months of backbar spend.
          </p>
        </div>
      </div>
    </section>
  )
}

function TrendLine() {
  // actual (solid) then predicted (dashed) spend curve
  const actual = 'M0,46 C22,40 40,34 62,30 C84,26 104,22 128,18'
  const predicted = 'M128,18 C150,15 172,13 196,10 C220,7 250,6 300,5'
  return (
    <svg
      viewBox="0 0 300 56"
      className="h-14 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${actual} L300,56 L0,56 Z`}
        fill="url(#fill)"
        stroke="none"
      />
      <path
        d={actual}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d={predicted}
        fill="none"
        stroke="var(--sage)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="4 5"
      />
      <circle cx="128" cy="18" r="3.5" fill="var(--gold)" />
    </svg>
  )
}
