'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2, Tags } from 'lucide-react'

export function ManageCategoriesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  async function fetchCategories() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.data) {
        setCategories(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return
    setIsAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      })
      if (res.ok) {
        setNewCategoryName('')
        fetchCategories()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? (Existing items will keep this category name until changed)')) return
    
    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setCategories(cats => cats.filter(c => c.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-card rounded-3xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-semibold">Categories</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
            <button
              onClick={handleAdd}
              disabled={isAdding || !newCategoryName.trim()}
              className="bg-foreground text-background px-4 py-2 rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                No categories found.
              </div>
            ) : (
              categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50 group">
                  <span className="text-sm font-medium">{category.name}</span>
                  {category.name !== 'Uncategorized' && (
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
