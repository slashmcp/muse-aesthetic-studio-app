'use client'

import { useState } from 'react'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents..."
          className="flex-1 px-4 py-2 bg-background border rounded-md"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-white bg-primary rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((doc) => (
            <div key={doc.id} className="p-4 bg-background border rounded-lg">
              <h3 className="font-bold text-lg">{doc.title}</h3>
              <p className="text-muted-foreground mt-2">{doc.content.substring(0, 150)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
