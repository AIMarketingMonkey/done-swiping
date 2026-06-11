'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: boolean
  unreadCount?: number
  photoColor: string
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Sarah',
    lastMessage: 'That sounds like a great place! Have you been to the new one downtown?',
    time: '2m ago',
    unread: true,
    unreadCount: 3,
    photoColor: 'from-rose-200 to-pink-300',
  },
  {
    id: '2',
    name: 'Elena',
    lastMessage: "I'd love to! Saturday works perfectly for me 😊",
    time: '1h ago',
    unread: true,
    unreadCount: 1,
    photoColor: 'from-purple-200 to-violet-300',
  },
  {
    id: '3',
    name: 'Michael',
    lastMessage: 'The jazz festival was amazing. You would have loved it!',
    time: '3h ago',
    unread: false,
    photoColor: 'from-amber-200 to-orange-300',
  },
  {
    id: '4',
    name: 'David',
    lastMessage: "Great talking with you! Let's catch up soon.",
    time: 'Yesterday',
    unread: false,
    photoColor: 'from-blue-200 to-cyan-300',
  },
]

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch_ = async () => {
      try {
        await new Promise(r => setTimeout(r, 500))
        setConversations(mockConversations)
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <MessageCircle size={22} className="text-primary" />
          Messages
        </h1>
        {/* Search */}
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
            <p className="text-gray-500 text-sm">
              Like someone to start a conversation!
            </p>
            <Link
              href="/matches"
              className="mt-4 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold"
            >
              View Matches
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No conversations found</div>
        ) : (
          <div className="bg-white divide-y divide-gray-50">
            {filtered.map(convo => (
              <Link key={convo.id} href={`/messages/${convo.id}`}>
                <div className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${convo.photoColor} flex items-center justify-center shrink-0 relative`}>
                    <span className="text-lg font-bold text-white/80">{convo.name[0]}</span>
                    {convo.unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-white" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className={`text-sm ${convo.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {convo.name}
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0 ml-2">{convo.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${convo.unread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        {convo.lastMessage}
                      </p>
                      {convo.unreadCount && convo.unreadCount > 0 && (
                        <span className="ml-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
