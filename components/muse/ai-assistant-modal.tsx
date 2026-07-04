'use client'

import { X, Send, Sparkles, Bot, User, Mic, Paperclip, Camera, GripHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface AiAssistantModalProps {
  isOpen: boolean
  startWithVoice?: boolean
  initialQuery?: string
  onClose: () => void
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string | any[]
  toolInvocations?: any[]
}

export function AiAssistantModal({ isOpen, startWithVoice, initialQuery, onClose }: AiAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false)
  
  const [isDesktop, setIsDesktop] = useState(true)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dragStartElementPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop)
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartPos.current.x
      const dy = e.clientY - dragStartPos.current.y
      setPosition({
        x: dragStartElementPos.current.x + dx,
        y: dragStartElementPos.current.y + dy
      })
    }
    const handleMouseUp = () => setIsDragging(false)
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const appendMessage = async (content: string) => {
    if (!content.trim()) return

    const newMessage: Message = { id: Date.now().toString(), role: 'user', content }
    setMessages(prev => [...prev, newMessage])
    setIsLoading(true)

    try {
      const apiMessages = [...messages, newMessage].map(m => ({ role: m.role, content: m.content }))
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      })
      
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          toolInvocations: data.toolInvocations
        }])
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to process request.'}`
        }])
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${err.message}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle initial query from search
  useEffect(() => {
    if (isOpen && initialQuery && !hasProcessedInitialQuery) {
      appendMessage(initialQuery)
      setHasProcessedInitialQuery(true)
    }
    if (!isOpen) {
      setHasProcessedInitialQuery(false)
    }
  }, [isOpen, initialQuery, hasProcessedInitialQuery])

  // Setup Web Speech API
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
          setInput(transcript)
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

  // Start voice automatically if requested
  useEffect(() => {
    if (isOpen && startWithVoice && recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error(e)
      }
    }
  }, [isOpen, startWithVoice])

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setInput('') // clear previous
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const currentInput = input
    setInput('')
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
    appendMessage(currentInput)
  }

  const handleClose = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
    onClose()
  }

  const suggestionPills = [
    "🎫 Next Face & Body Expo in Chicago",
    "📊 Log $50 invoice for SkinCeuticals",
    "📅 Upcoming spa shows in Des Moines",
    "📝 Show me my top expenses this month"
  ]

  if (!isOpen) return null

  const modalContent = (
    <>
      {/* Header (Draggable) */}
      <div 
        className={`flex items-center justify-between p-4 border-b border-border bg-background/50 ${isDesktop ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={isDesktop ? (e) => {
          setIsDragging(true)
          dragStartPos.current = { x: e.clientX, y: e.clientY }
          dragStartElementPos.current = position
        } : undefined}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Muse AI {isDesktop && <GripHorizontal className="h-3 w-3 text-muted-foreground opacity-50" />}
            </h2>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sage inline-block" /> Online
            </p>
          </div>
        </div>
        <button 
          onClick={handleClose}
          onMouseDown={e => e.stopPropagation()} // Prevent drag when clicking close
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-3 opacity-60">
              <Sparkles className="h-8 w-8 text-gold mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">
                I'm your Muse AI assistant. <br/> How can I help you manage the studio today?
              </p>
            </div>
            
            <div className="w-full max-w-[280px] space-y-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground text-left mb-2 uppercase tracking-wider">Suggested for you</p>
              {suggestionPills.map((suggestion, i) => (
                <button 
                  key={i}
                  onClick={() => appendMessage(suggestion.split(' ').slice(1).join(' '))}
                  className="w-full text-left text-sm px-4 py-2.5 bg-background border border-border hover:border-gold/50 hover:bg-gold/5 rounded-lg transition-colors text-foreground shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className="space-y-2">
              <div className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center border ${
                  m.role === 'user' ? 'bg-primary border-primary' : 'bg-muted border-border'
                }`}>
                  {m.role === 'user' ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 text-foreground" />
                  )}
                </div>
                {typeof m.content === 'string' && m.content && (
                  <div className={`rounded-2xl px-4 py-2 max-w-[75%] text-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-muted text-foreground rounded-tl-sm'
                  }`}>
                    {m.content}
                  </div>
                )}
              </div>
              
              {/* Render Tool Invocations */}
              {m.toolInvocations?.map((toolInvocation: any, index: number) => {
                return (
                  <div key={toolInvocation.toolCallId || index} className="flex gap-3 ml-11">
                    <div className="bg-background border border-border rounded-lg p-3 text-xs text-muted-foreground max-w-[85%]">
                      <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                        <Sparkles className="h-3 w-3 text-gold" />
                        Executing Action: {toolInvocation.toolName}
                      </div>
                      <pre className="overflow-x-auto p-2 bg-muted rounded mt-2 max-h-32">
                        {JSON.stringify(toolInvocation.args, null, 2)}
                      </pre>
                      {toolInvocation.result && (
                        <div className={`mt-2 pt-2 border-t border-border font-medium ${toolInvocation.result.success === false ? 'text-destructive' : 'text-sage'}`}>
                          {toolInvocation.result.success === false ? `✗ Failed: ${toolInvocation.result.error || 'Unknown error'}` : `✓ ${toolInvocation.result.message || 'Success'}`}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center border bg-muted border-border">
              <Bot className="h-4 w-4 text-foreground" />
            </div>
            <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce" />
              <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background/50">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <button
            type="button"
            className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Camera className="h-4 w-4" />
          </button>
          
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Message Muse AI..."}
              className="w-full bg-background border border-border rounded-full pl-4 pr-20 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
            
            <div className="absolute right-1 top-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={toggleListen}
                className={`h-7 w-7 flex items-center justify-center rounded-full transition-colors ${
                  isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
              </button>
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !isListening)}
                className="h-7 w-7 flex items-center justify-center rounded-full bg-gold text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                <Send className="h-3.5 w-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <div 
        className="fixed z-50 bg-card border border-border shadow-2xl flex flex-col rounded-xl overflow-hidden shadow-soft animate-in zoom-in-95 duration-200"
        style={{
          top: `max(20px, min(100vh - 400px, 40px + ${position.y}px))`,
          right: `max(20px, min(100vw - 300px, 40px - ${position.x}px))`,
          width: '380px',
          height: '600px',
          resize: 'both',
          minWidth: '280px',
          minHeight: '400px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
      >
        {modalContent}
      </div>
    )
  }

  // Mobile layout
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        {modalContent}
      </div>
    </div>
  )
}
