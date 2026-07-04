'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'

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
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? "Listening..." : "Search documents or Ask AI..."}
            className="w-full px-4 py-2 pr-10 bg-background border border-border focus:ring-1 focus:ring-gold focus:outline-none rounded-md text-sm"
          />
          <button
            type="button"
            onClick={toggleListen}
            className={`absolute right-2 top-1.5 h-6 w-6 flex items-center justify-center rounded-full transition-colors ${
              isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            if (query.trim() && onAskAI) {
              onAskAI(query)
            }
          }}
          className="px-4 py-2 text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 rounded-md font-medium text-sm transition-colors whitespace-nowrap"
        >
          Ask AI
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-primary-foreground bg-primary hover:opacity-90 transition-opacity rounded-md disabled:opacity-50 font-medium text-sm"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
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
