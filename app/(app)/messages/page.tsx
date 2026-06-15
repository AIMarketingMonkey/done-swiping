'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface Conversation {
  id: string
  other_user: {
    id: string
    name: string
    photo: string | null
  }
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

// Gradient colours for avatar initials — cycles by first letter
const AVATAR_GRADIENTS = [
  'from-rose-200 to-pink-300',
  'from-amber-200 to-orange-300',
  'from-purple-200 to-violet-300',
  'from-blue-200 to-cyan-300',
  'from-green-200 to-emerald-300',
  'from-indigo-200 to-purple-300',
]

function avatarGradient(name: string) {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length]
}

function formatTime(iso: string | null) {
  if (!iso) return ''
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: false })
      .replace('about ', '')
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' hours', 'h')
      .replace(' hour', 'h')
      .replace(' days', 'd')
      .replace(' day', 'd')
  } catch {
    return ''
  }
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/messages')
    const data = await res.json()
    setConversations(data.conversations ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Real-time: refetch list when any message arrives in any of user's conversations
  useEffect(() => {
    const channel = supabase
      .channel('messages-list')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchConversations, supabase])

  const filtered = conversations.filter(c =>
    c.other_user.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <MessageCircle size={22} className="text-primary" />
          Messages
        </h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-full text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="py-2">
        {loading ? (
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && !search ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="bg-rose-50 rounded-full p-6 mb-4">
              <MessageCircle size={40} className="text-primary/40" />
            </div>
            <h3 className="font-bold text-gray-700 text-lg mb-2">No messages yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              When you and a match decide to start chatting, it will appear here.
            </p>
            <Link
              href="/matches"
              className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold"
            >
              View Matches
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No conversations found</div>
        ) : (
          <div className="bg-white divide-y divide-gray-50">
            {filtered.map(convo => {
              const hasUnread = convo.unread_count > 0
              return (
                <Link key={convo.id} href={`/messages/${convo.id}`}>
                  <div className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {convo.other_user.photo ? (
                        <img
                          src={convo.other_user.photo}
                          alt={convo.other_user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradient(convo.other_user.name)} flex items-center justify-center`}>
                          <span className="text-lg font-bold text-white/90">
                            {convo.other_user.name[0]}
                          </span>
                        </div>
                      )}
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <span className={`text-sm ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {convo.other_user.name}
                        </span>
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                          {formatTime(convo.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {convo.last_message ?? 'Start the conversation'}
                        </p>
                        {convo.unread_count > 0 && (
                          <span className="ml-2 bg-primary text-white text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shrink-0">
                            {convo.unread_count > 99 ? '99+' : convo.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
