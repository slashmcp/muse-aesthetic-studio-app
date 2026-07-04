'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { X, Check, Store, DollarSign, Tag, Loader2, ScanLine } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { currency } from '@/lib/muse-data'

type Phase = 'uploading' | 'review'

export function CaptureModal({ file, onClose }: { file?: File, onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('uploading')
  const [tag, setTag] = useState('#Uncategorized')
  const [extractedData, setExtractedData] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('/receipt-scan.png')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const tags = ['#Supplies', '#Rent', '#Utilities', '#Marketing', '#Personal', '#Software', '#Meals', '#Travel', '#Uncategorized']

  useEffect(() => {
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
      processReceipt(file)
    } else {
      // Mock flow if no file (shouldn't happen but fallback)
      const t = setTimeout(() => {
        setExtractedData({ title: 'Mock Vendor', amount: 99.99, publicUrl: '' })
        setTag('#Supplies')
        setPhase('review')
      }, 2600)
      return () => clearTimeout(t)
    }
    return () => {
      if (file && previewUrl !== '/receipt-scan.png') URL.revokeObjectURL(previewUrl)
    }
  }, [file])

  const processReceipt = async (imgFile: File) => {
    try {
      const formData = new FormData()
      formData.append('file', imgFile)
      
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setExtractedData({
        title: data.extracted.title,
        amount: data.extracted.amount,
        is_recurring: data.extracted.is_recurring,
        publicUrl: data.publicUrl
      })
      setTag(`#${data.extracted.category}`)
      setPhase('review')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to process receipt')
      setPhase('review')
    }
  }

  const handleSave = async () => {
    if (!extractedData) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from('documents').insert([{
        title: extractedData.title,
        amount: extractedData.amount,
        category: tag.replace('#', ''),
        content: `Scanned Receipt: ${extractedData.publicUrl}`,
        is_recurring: extractedData.is_recurring
      }])
      
      if (error) throw error
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to save to ledger')
      setIsSaving(false)
    }
  }

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
            src={previewUrl}
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
        ) : errorMsg ? (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
            {errorMsg}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <ReviewField
              icon={Store}
              label="Vendor"
              value={extractedData?.title || ''}
            />
            <ReviewField
              icon={DollarSign}
              label="Total"
              value={currency(extractedData?.amount || 0)}
            />

            <div className="rounded-2xl border border-border bg-background-2 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Category Tag
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                      tag.toLowerCase() === t.toLowerCase()
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
              onClick={handleSave}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Add to Ledger'}
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
        <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{value}</p>
      </div>
      <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold text-sage">
        Detected
      </span>
    </div>
  )
}
