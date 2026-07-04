'use client'

import { Receipt, Zap, Megaphone, Package, FlaskConical } from 'lucide-react'
import {
  LEDGER,
  CATEGORY_META,
  currency,
  type Category,
} from '@/lib/muse-data'

const ICONS: Record<Category, typeof Zap> = {
  backbar: FlaskConical,
  utilities: Zap,
  marketing: Megaphone,
  supplies: Package,
}

const PILL: Record<Category, string> = {
  backbar: 'bg-gold/15 text-gold',
  utilities: 'bg-sage/15 text-sage',
  marketing: 'bg-accent text-accent-foreground',
  supplies: 'bg-muted text-muted-foreground',
}

export function Ledger() {
  return (
    <section aria-labelledby="ledger-heading" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-gold" />
          <h2
            id="ledger-heading"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Recent Ledger
          </h2>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-gold transition active:opacity-70"
        >
          View all
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <ul className="divide-y divide-border">
          {LEDGER.map((e) => {
            const Icon = ICONS[e.category]
            return (
              <li
                key={e.id}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-background-2"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background-2">
                  <Icon className="h-[18px] w-[18px] text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {e.vendor}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      · {e.date}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.description}
                  </p>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${PILL[e.category]}`}
                  >
                    {CATEGORY_META[e.category].tag}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {currency(e.amount)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
