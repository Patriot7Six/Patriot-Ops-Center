'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { FreeUsageBadge, useFreeUsage } from '@/components/FreeUsageBadge'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_PROMPTS = [
  'I want to file a VA claim for my knee injury I got during basic training.',
  "I was denied last year. How do I appeal my VA disability decision?",
  'How do I document a mental health condition for a VA claim?',
  'I have an existing 30% rating. Can I file a new claim for additional conditions?',
]

export default function ClaimsPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { usage, updateFromResponse } = useFreeUsage('claims')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const content = text ?? input.trim()
    if (!content || isStreaming) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setIsStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      updateFromResponse(res)

      if (res.status === 429) {
        const text = await res.text()
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: text }
          return updated
        })
        return
      }

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
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen flex flex-col">
        <div className="border-b border-white/[0.06] px-4 py-5">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Link href="/benefits" className="text-slate-500 hover:text-slate-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Claims Copilot</h1>
              <p className="text-xs text-slate-500">Step-by-step AI guidance for VA claims</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Claims Copilot</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
                  Tell me about your condition or situation and I&apos;ll walk you through filing a stronger VA claim, step by step.
                </p>
                <FreeUsageBadge usage={usage} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {STARTER_PROMPTS.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-left text-sm text-slate-400 bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] hover:text-white rounded-xl px-4 py-3 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gold-500/10 border border-gold-500/20 text-white'
                    : 'bg-white/[0.04] border border-white/[0.07] text-slate-200'
                }`}>
                  {msg.content || (isStreaming && i === messages.length - 1 ? (
                    <span className="flex items-center gap-2 text-slate-400"><Spinner size="sm" /> Thinking...</span>
                  ) : null)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-white/[0.06] bg-navy-950/90 backdrop-blur-xl p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Describe your injury, condition, or claim situation..."
              rows={2}
              disabled={isStreaming}
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50"
            />
            <Button onClick={() => send()} disabled={!input.trim() || isStreaming} className="self-end" size="md">
              {isStreaming ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </div>
          {messages.length > 0 && <div className="max-w-3xl mx-auto mt-3"><FreeUsageBadge usage={usage} /></div>}
          <p className="text-center text-xs text-slate-700 mt-2">
            This is informational guidance only. Work with an accredited VSO for formal claim submission.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
