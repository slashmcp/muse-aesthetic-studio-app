'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Paperclip } from 'lucide-react'

// Ensure SpeechRecognition is available on window for TS
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function SearchBar({ onAskAI }: { onAskAI?: (query: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.error) {
        alert(`Upload failed: ${data.error}`)
      } else {
        alert('File uploaded and saved to Ledger successfully!')
      }
    } catch (err) {
      console.error(err)
      alert('Upload failed due to network error.')
    } finally {
      setIsLoading(false)
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        
        recognitionRef.current.onresult = (event: any) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          setQuery(transcript)
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setQuery('')
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.data) {
        setResults(data.data)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <form onSubmit={(e) => {
        e.preventDefault()
        // If query exists, open AI portal
        if (query.trim() && onAskAI) {
          onAskAI(query)
        } else {
          handleSearch(e)
        }
      }} className="flex gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,image/*" 
          onChange={handleFileUpload} 
        />
        
        <div className="relative flex-1 flex items-center bg-background border border-border rounded-full focus-within:ring-1 focus-within:ring-gold transition-shadow">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 h-10 w-10 flex items-center justify-center rounded-l-full text-muted-foreground hover:bg-muted/50 transition-colors ml-1"
            title="Upload file or PDF"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? "Listening..." : "Search or Ask AI..."}
            className="flex-1 px-2 py-2.5 bg-transparent focus:outline-none text-sm"
          />
          
          <div className="flex items-center gap-1 pr-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleListen}
              className={`h-7 w-7 flex items-center justify-center rounded-full transition-colors ${
                isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
            </button>
            <button
              type="submit"
              disabled={isLoading || (!query.trim() && !isListening)}
              className="h-8 w-24 flex items-center justify-center rounded-full bg-gold text-primary-foreground disabled:opacity-50 transition-opacity text-xs font-semibold mr-0.5"
            >
              {isLoading ? '...' : 'Ask Muse'}
            </button>
          </div>
        </div>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((doc) => (
            <div key={doc.id} className="p-4 bg-background border border-border rounded-lg shadow-sm">
              <h3 className="font-bold text-lg">{doc.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{doc.content.substring(0, 150)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
