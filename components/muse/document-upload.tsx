'use client'

import { useState } from 'react'
import { Upload, Camera, RefreshCw } from 'lucide-react'

export function DocumentUpload() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDuration, setRecurringDuration] = useState('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content, 
          isRecurring, 
          recurringDuration: isRecurring ? recurringDuration : null 
        }),
      })
      const data = await res.json()
      
      if (res.ok && data.data) {
        setMessage('Invoice / Receipt uploaded successfully! AI will process it shortly.')
        setTitle('')
        setContent('')
        setIsRecurring(false)
      } else {
        setMessage(data.error || 'Failed to upload invoice/receipt')
      }
    } catch (error) {
      console.error('Error uploading:', error)
      setMessage('An error occurred while uploading.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 p-6 bg-card border border-border rounded-xl shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          <Upload className="h-5 w-5 text-gold" />
          <Camera className="h-5 w-5 text-gold" />
        </div>
        <h2 className="text-lg font-semibold">Upload Invoice / Receipt</h2>
      </div>
      
      <form onSubmit={handleUpload} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Invoice or Receipt title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Content (Optional)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-md h-32 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Paste invoice or receipt text here for AI processing..."
          />
        </div>

        <div className="flex flex-col gap-3 p-4 border border-border rounded-lg bg-background/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded border-border text-gold focus:ring-gold accent-gold"
            />
            <div className="flex items-center gap-1.5 select-none">
              <RefreshCw className={`h-4 w-4 ${isRecurring ? 'text-gold' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium text-foreground">Recurring Expense</span>
            </div>
          </label>
          
          {isRecurring && (
            <div className="ml-7 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <span className="text-sm text-muted-foreground">Frequency:</span>
              <select
                value={recurringDuration}
                onChange={(e) => setRecurringDuration(e.target.value)}
                className="bg-background border border-border rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 text-primary-foreground bg-primary rounded-md disabled:opacity-50 font-medium transition hover:opacity-90"
        >
          {isLoading ? 'Uploading...' : 'Upload to Supabase'}
        </button>
      </form>
      
      {message && (
        <p className={`text-sm text-center font-medium ${message.includes('successfully') ? 'text-sage' : 'text-destructive'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
