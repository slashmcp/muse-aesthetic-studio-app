'use client'

import { useEffect, useState, useMemo } from 'react'
import { FileText, ArrowUpDown, Loader2, Trash2 } from 'lucide-react'
import { currency } from '@/lib/muse-data'

type SortField = 'created_at' | 'title' | 'category' | 'amount'
type SortOrder = 'asc' | 'desc'

export function LedgerTab() {
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    fetchLedger()
  }, [])

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      const res = await fetch('/api/ledger', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // Handle nulls
      if (aVal === null) aVal = ''
      if (bVal === null) bVal = ''

      // Numeric comparison
      if (sortField === 'amount') {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }

      // Date comparison
      if (sortField === 'created_at') {
        const aDate = new Date(aVal).getTime()
        const bDate = new Date(bVal).getTime()
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
      }

      // String comparison
      aVal = String(aVal).toLowerCase()
      bVal = String(bVal).toLowerCase()
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [documents, sortField, sortOrder])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center gap-2 mb-4 px-2">
        <FileText className="h-5 w-5 text-gold" />
        <h2 className="text-xl font-semibold">Ledger</h2>
      </div>

      {documents.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
          No records found. Start capturing invoices or receipts!
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-2">
                      Date
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-2">
                      Description
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-2">
                      Category
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-2 justify-end">
                      Amount
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedDocuments.map((doc) => {
                  const urlMatch = doc.content?.match(/(https?:\/\/[^\s]+)/)
                  const fileUrl = urlMatch ? urlMatch[0] : null

                  return (
                    <tr 
                      key={doc.id} 
                      onClick={() => {
                        if (fileUrl) window.open(fileUrl, '_blank')
                      }}
                      className={`bg-card border-b border-border/50 transition-colors ${fileUrl ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/30'}`}
                      title={fileUrl ? 'Click to view original document' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex flex-col gap-1">
                          <span>{doc.title || 'Untitled'}</span>
                          {doc.is_recurring && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-gold/10 text-gold rounded w-fit border border-gold/20">
                              {doc.recurring_duration}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-muted rounded-md text-xs font-medium text-foreground">
                          {doc.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        {currency(Number(doc.amount) || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(doc.id)
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
