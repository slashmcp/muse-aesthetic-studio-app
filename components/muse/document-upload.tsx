'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

export function DocumentUpload() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
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
        body: JSON.stringify({ title, content }),
      })
      const data = await res.json()
      
      if (res.ok && data.data) {
        setMessage('Document uploaded successfully! AI will process it shortly.')
        setTitle('')
        setContent('')
      } else {
        setMessage(data.error || 'Failed to upload document')
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
        <Upload className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-semibold">Upload Document</h2>
      </div>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Document title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Content (Optional)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-md h-32 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Paste document content here for AI processing..."
          />
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
