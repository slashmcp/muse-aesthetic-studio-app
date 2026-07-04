'use client'

import { useChat } from '@ai-sdk/react'
import { X, Send, Sparkles, Bot, User, Mic } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface AiAssistantModalProps {
  isOpen: boolean
  startWithVoice?: boolean
  onClose: () => void
}

// Ensure SpeechRecognition is available on window for TS
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function AiAssistantModal({ isOpen, startWithVoice, onClose }: AiAssistantModalProps) {
  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
          // Optional: automatically submit when speech ends if input is not empty
          // But usually better to let user confirm.
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsListening(false)
        }
      }
    }
  }, [setInput])

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

  // Handle closing modal
  const handleClose = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Muse AI</h2>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sage inline-block" /> Online
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
              <Sparkles className="h-8 w-8 text-gold" />
              <p className="text-sm text-muted-foreground font-medium">
                I'm your Muse AI assistant. <br/> How can I help you manage the studio today?
              </p>
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
                  {m.content && (
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
                {m.toolInvocations?.map((toolInvocation: any) => {
                  const toolCallId = toolInvocation.toolCallId
                  const addResult = (result: string) => {} // we don't have client side tool resolution yet
                  
                  return (
                    <div key={toolCallId} className="flex gap-3 ml-11">
                      <div className="bg-background border border-border rounded-lg p-3 text-xs text-muted-foreground max-w-[85%]">
                        <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                          <Sparkles className="h-3 w-3 text-gold" />
                          Executing Action: {toolInvocation.toolName}
                        </div>
                        <pre className="overflow-x-auto p-2 bg-muted rounded mt-2">
                          {JSON.stringify(toolInvocation.args, null, 2)}
                        </pre>
                        {'result' in toolInvocation && (
                          <div className="mt-2 pt-2 border-t border-border text-sage font-medium">
                            ✓ {toolInvocation.result?.message || 'Success'}
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
              onClick={toggleListen}
              className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-full transition-colors ${
                isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
            <div className="relative flex-1">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder={isListening ? "Listening..." : "Ask Muse AI..."}
                className="w-full bg-background border border-border rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !isListening)}
                className="absolute right-1.5 top-1.5 h-8 w-8 flex items-center justify-center rounded-full bg-gold text-primary-foreground disabled:opacity-50 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
