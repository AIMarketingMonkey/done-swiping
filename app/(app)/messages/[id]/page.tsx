'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Sparkles, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  sender_id: string
  message_text: string
  created_at: string
  read_at: string | null
}

interface OtherUser {
  id: string
  name: string
  profile_photos?: { image_url: string; is_primary: boolean }[]
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [suggestionLoading, setSuggestionLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const res = await fetch(`/api/messages/${conversationId}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
      setOtherUser(data.other_user ?? null)
      setLoading(false)
    }
    load()
  }, [conversationId])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, data.message])
      }
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  async function suggestOpener() {
    if (!otherUser || suggestionLoading) return
    setSuggestionLoading(true)
    try {
      const res = await fetch('/api/ai/suggest-opener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchUserId: otherUser.id }),
      })
      const data = await res.json()
      if (data.suggestion) setInput(data.suggestion)
    } finally {
      setSuggestionLoading(false)
    }
  }

  const otherPhoto = otherUser?.profile_photos?.find(p => p.is_primary)?.image_url
    ?? otherUser?.profile_photos?.[0]?.image_url

  return (
    <div className="app-shell flex flex-col h-dvh">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white shrink-0 pt-safe">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {otherPhoto ? (
          <img src={otherPhoto} alt={otherUser?.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{otherUser?.name ?? 'Your match'}</h2>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              You matched! Break the ice with a genuine first message.
            </p>
            <button
              onClick={suggestOpener}
              disabled={suggestionLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors mx-auto disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {suggestionLoading ? 'Thinking...' : 'Get an AI opener'}
            </button>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMe ? 'chat-bubble-user' : 'chat-bubble-ai'} px-4 py-2.5`}>
                  <p className="text-sm leading-relaxed">{msg.message_text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-white pb-safe">
        <div className="flex items-end gap-2">
          {messages.length === 0 && (
            <button
              onClick={suggestOpener}
              disabled={suggestionLoading}
              className="p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-60 shrink-0"
              title="AI message suggestion"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            placeholder="Write a message..."
            rows={1}
            className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
