'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_PROMPTS = [
  { label: 'Networking', text: 'How do I build a professional network as a veteran with no civilian contacts?' },
  { label: 'Education', text: 'Should I use my GI Bill for a degree or get industry certifications? I want to work in cybersecurity.' },
  { label: 'Interviews', text: 'How do I explain my military experience in a job interview without losing the interviewer?' },
  { label: 'Federal Jobs', text: 'What federal government jobs should I target with an infantry background?' },
  { label: 'Salary', text: 'How does military pay compare to private sector vs federal GS pay? What should I expect?' },
  { label: 'LinkedIn', text: 'How should I set up my LinkedIn profile as a transitioning veteran?' },
]

export function CareerChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || isStreaming) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setIsStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', messages: newMessages }),
      })

      if (!res.ok) throw new Error('Request failed')
      if (!res.body) throw new Error('No body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleClear() {
    setMessages([])
    setInput('')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Starter prompts — only shown before first message */}
      {messages.length === 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-3">Common questions to get started:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STARTER_PROMPTS.map(p => (
              <button
                key={p.label}
                onClick={() => send(p.text)}
                className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.12] rounded-xl px-4 py-3 transition-all group"
              >
                <p className="text-xs font-semibold text-gold-400 mb-0.5">{p.label}</p>
                <p className="text-xs text-slate-500 group-hover:text-slate-400 leading-relaxed line-clamp-2 transition-colors">
                  {p.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gold-500/10 border border-gold-500/20 text-white'
                      : 'bg-white/[0.04] border border-white/[0.07] text-slate-200'
                  }`}
                >
                  {msg.content || (
                    isStreaming && i === messages.length - 1
                      ? <span className="flex items-center gap-2 text-slate-400"><Spinner size="sm" /> Thinking…</span>
                      : null
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Clear conversation */}
          <div className="px-5 py-2 border-t border-white/[0.05] flex justify-end">
            <button
              onClick={handleClear}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Clear conversation
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your career transition… (Enter to send, Shift+Enter for new line)"
          rows={2}
          disabled={isStreaming}
          className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50"
        />
        <Button
          onClick={() => send()}
          disabled={!input.trim() || isStreaming}
          size="md"
          className="shrink-0"
        >
          {isStreaming
            ? <Spinner size="sm" />
            : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )
          }
        </Button>
      </div>

      <p className="text-xs text-slate-700 text-center -mt-2">
        Career guidance is informational. Always verify salary data and opportunities with current job boards.
      </p>
    </div>
  )
}
