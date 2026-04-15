'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_QUESTIONS = [
  'I served 4 years Army active duty and was honorably discharged in 2020. What benefits do I qualify for?',
  'I have a 70% disability rating. Am I eligible for TDIU?',
  'Can I use the GI Bill and VA disability compensation at the same time?',
  "My discharge was OTH. Do I still have access to any VA benefits?",
]

export default function EligibilityPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/ai/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.body) throw new Error('No response body')

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
    } catch (err) {
      console.error(err)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }
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
        {/* Header */}
        <div className="border-b border-white/[0.06] px-4 py-5">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Link href="/benefits" className="text-slate-500 hover:text-slate-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">VA Eligibility Checker</h1>
              <p className="text-xs text-slate-500">AI-powered benefit eligibility analysis</p>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Check Your Eligibility</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
                  Tell me about your military service and I&apos;ll analyze every VA benefit you qualify for — instantly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {STARTER_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-left text-sm text-slate-400 bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white rounded-xl px-4 py-3 transition-all"
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
                    <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gold-500/10 border border-gold-500/20 text-white'
                      : 'bg-white/[0.04] border border-white/[0.07] text-slate-200'
                  }`}
                >
                  {msg.content || (isStreaming && i === messages.length - 1 ? (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Spinner size="sm" /> Analyzing...
                    </span>
                  ) : null)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] bg-navy-950/90 backdrop-blur-xl p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Describe your service, discharge status, or ask about a specific benefit..."
              rows={2}
              disabled={isStreaming}
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 transition-all disabled:opacity-50"
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || isStreaming}
              className="self-end"
              size="md"
            >
              {isStreaming ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-slate-700 mt-2">
            AI responses are informational only. Always verify with an accredited VSO or VA.gov.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
