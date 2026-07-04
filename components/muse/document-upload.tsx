'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Camera, RefreshCw, FileImage, X } from 'lucide-react'

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDuration, setRecurringDuration] = useState('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsLoading(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('isRecurring', String(isRecurring))
      if (isRecurring) formData.append('recurringDuration', recurringDuration)

      const res = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      
      if (res.ok && data.data) {
        setMessage('File uploaded successfully! AI has extracted and saved the details.')
        setFile(null)
        setIsRecurring(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setMessage(data.error || 'Failed to upload')
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
        <UploadCloud className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-semibold">Upload Invoice / Receipt</h2>
      </div>
      
      <form onSubmit={handleUpload} className="space-y-5">
        
        {/* Dropzone */}
        {!file ? (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50 hover:bg-muted/30 bg-background/50'
            }`}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              accept=".pdf,image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0])
              }}
            />
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <UploadCloud className="h-10 w-10 text-muted-foreground/60" />
              <div className="text-center">
                <p className="font-medium text-foreground">Click or drag a file here</p>
                <p className="text-sm mt-1">Accepts Images or PDFs</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full p-4 border border-border rounded-xl bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
                <FileImage className="h-5 w-5 text-gold" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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
              <span className="text-sm font-medium text-foreground">Flag as Recurring</span>
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
          disabled={isLoading || !file}
          className="w-full px-4 py-2 text-primary-foreground bg-primary rounded-md disabled:opacity-50 font-medium transition hover:opacity-90 flex justify-center"
        >
          {isLoading ? 'Processing with AI...' : 'Process & Upload'}
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
