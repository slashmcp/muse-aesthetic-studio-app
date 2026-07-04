'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { X, Check, Store, DollarSign, Tag, Loader2, ScanLine } from 'lucide-react'

type Phase = 'uploading' | 'review'

export function CaptureModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('uploading')
  const [tag, setTag] = useState('#backbar')

  useEffect(() => {
    const t = setTimeout(() => setPhase('review'), 2600)
    return () => clearTimeout(t)
  }, [])

  const tags = ['#backbar', '#supplies', '#utilities', '#marketing']

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-md items-end justify-center">
      <button
        type="button"
        aria-label="Close capture"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <div className="relative z-10 m-3 mb-4 w-full rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {phase === 'uploading' ? 'Scanning receipt' : 'Review & confirm'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background-2 text-muted-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Receipt preview with scanning sweep */}
        <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-background-2">
          <Image
            src="/receipt-scan.png"
            alt="Captured receipt being scanned"
            fill
            className={`object-cover transition ${
              phase === 'uploading' ? 'brightness-90' : 'brightness-100'
            }`}
            sizes="(max-width: 448px) 100vw, 448px"
          />
          {phase === 'uploading' && (
            <>
              <div className="absolute inset-x-0 h-16 animate-scan bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30">
                <div className="flex items-center gap-2 rounded-full bg-card/90 px-3 py-1.5 shadow-soft">
                  <ScanLine className="h-4 w-4 animate-softpulse text-gold" />
                  <span className="text-xs font-semibold text-foreground">
                    Extracting fields…
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {phase === 'uploading' ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            Muse AI is reading vendor, total & category
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <ReviewField
              icon={Store}
              label="Vendor"
              value="Skin Script Rx"
            />
            <ReviewField
              icon={DollarSign}
              label="Total"
              value="$317.79"
            />

            <div className="rounded-2xl border border-border bg-background-2 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Category Tag
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                      tag === t
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              Add to Ledger
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Store
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background-2 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
        <Icon className="h-[18px] w-[18px] text-gold" />
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
      <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold text-sage">
        Detected
      </span>
    </div>
  )
}
