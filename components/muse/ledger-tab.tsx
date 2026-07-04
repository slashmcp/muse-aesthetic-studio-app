'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'

export function LedgerTab() {
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLedger() {
      try {
        const res = await fetch('/api/ledger')
        const data = await res.json()
        if (data.data) {
          setDocuments(data.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLedger()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 flex justify-center opacity-60">
        <span className="animate-pulse">Loading ledger...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-4 px-2">
        <FileText className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-semibold">Ledger</h2>
      </div>

      {documents.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
          No records found. Start capturing invoices or receipts!
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map(doc => (
            <div key={doc.id} className="p-4 bg-card border border-border rounded-xl shadow-soft">
              <h3 className="font-bold text-lg mb-1">{doc.title || 'Untitled Document'}</h3>
              <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                {doc.content || 'No content provided.'}
              </p>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground/80 font-medium">
                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                {doc.is_recurring && (
                  <span className="px-2 py-0.5 bg-gold/10 text-gold rounded-full border border-gold/20">
                    Recurring: {doc.recurring_duration}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
