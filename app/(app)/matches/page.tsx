'use client'

import { useState, useEffect } from 'react'
import { Heart, Filter, Sparkles, Mic, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const MINIMUM_COMPLETENESS = 40

type FilterTab = 'all' | 'new' | 'saved'

interface Match {
  id: string
  name: string
  age: number
  compatibility: number
  compatibilityNote: string
  isNew?: boolean
  isSaved?: boolean
  photoColor?: string
}

const mockMatches: Match[] = [
  { id: '1', name: 'Sarah', age: 42, compatibility: 94, compatibilityNote: 'Shared love of outdoors', isNew: true, photoColor: 'from-rose-200 to-pink-300' },
  { id: '2', name: 'Michael', age: 48, compatibility: 88, compatibilityNote: 'Creative souls align', photoColor: 'from-amber-200 to-orange-300' },
  { id: '3', name: 'Elena', age: 39, compatibility: 91, compatibilityNote: 'Mindful living values', isNew: true, photoColor: 'from-purple-200 to-violet-300' },
  { id: '4', name: 'David', age: 45, compatibility: 85, compatibilityNote: 'Family-first mindset', isSaved: true, photoColor: 'from-blue-200 to-cyan-300' },
  { id: '5', name: 'Maria', age: 41, compatibility: 89, compatibilityNote: 'Adventure & curiosity', isSaved: true, photoColor: 'from-green-200 to-emerald-300' },
  { id: '6', name: 'James', age: 52, compatibility: 82, compatibilityNote: 'Deep conversations', photoColor: 'from-indigo-200 to-purple-300' },
]

function LockedState({ completeness }: { completeness: number }) {
  const router = useRouter()
  const remaining = MINIMUM_COMPLETENESS - completeness

  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <Lock className="w-9 h-9 text-gray-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Matches aren&apos;t ready yet</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        Sage needs to know you a little better before suggesting matches. Once your profile reaches {MINIMUM_COMPLETENESS}%, the right people will start appearing here.
      </p>

      {/* Completeness bar */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="text-gray-500">{completeness > 0 ? `${completeness}% complete` : 'Not started yet'}</span>
          <span className="text-gray-400">{MINIMUM_COMPLETENESS}% needed</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness > 0 && (
          <p className="text-xs text-gray-400 mt-1.5 text-right">
            About {remaining}% more to go
          </p>
        )}
      </div>

      <button
        onClick={() => router.push('/chat')}
        className="flex items-center gap-2.5 bg-primary text-white px-8 py-4 rounded-2xl font-semibold shadow-md active:scale-95 transition-transform"
      >
        <Mic className="w-5 h-5" />
        Chat with Sage
      </button>
      <p className="text-xs text-gray-400 mt-3">
        A few more sessions is usually enough
      </p>
    </div>
  )
}

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [completeness, setCompleteness] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch profile completeness
        const profileRes = await fetch('/api/profile')
        const profileData = await profileRes.json()
        const score = profileData?.profile?.profile_completion_score ?? 0
        setCompleteness(score)

        if (score >= MINIMUM_COMPLETENESS) {
          // TODO: replace with real API call when matches are implemented
          await new Promise(r => setTimeout(r, 400))
          setMatches(mockMatches)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = matches.filter(m => {
    if (activeTab === 'new') return m.isNew
    if (activeTab === 'saved') return m.isSaved
    return true
  })

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: matches.length },
    { key: 'new', label: 'New', count: matches.filter(m => m.isNew).length },
    { key: 'saved', label: 'Saved', count: matches.filter(m => m.isSaved).length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-5 pt-12 pb-4 shadow-sm">
          <div className="skeleton h-7 w-40 rounded mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-9 flex-1 rounded-full" />)}
          </div>
        </div>
        <div className="px-4 py-5 grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const isLocked = (completeness ?? 0) < MINIMUM_COMPLETENESS

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart size={22} className="text-primary fill-primary" />
            Your Matches
          </h1>
          {!isLocked && (
            <button className="p-2 rounded-full bg-gray-100 text-gray-500">
              <Filter size={18} />
            </button>
          )}
        </div>

        {!isLocked && (
          <div className="flex gap-2 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-white/80' : 'text-gray-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLocked ? (
        <LockedState completeness={completeness ?? 0} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="bg-rose-50 rounded-full p-6 mb-4">
            <Heart size={40} className="text-primary/40" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg mb-2">No matches here yet</h3>
          <p className="text-gray-500 text-sm max-w-[200px]">
            {activeTab === 'new' ? 'Check back soon for new matches.' : 'Save matches to find them here.'}
          </p>
        </div>
      ) : (
        <div className="px-4 py-5">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(match => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform">
                  <div className={`h-40 bg-gradient-to-br ${match.photoColor || 'from-rose-200 to-pink-300'} flex items-center justify-center relative`}>
                    <span className="text-5xl font-bold text-white/80">{match.name[0]}</span>
                    {match.isNew && (
                      <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900 text-sm">{match.name}, {match.age}</span>
                    </div>
                    <span className="inline-block bg-rose-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 mb-1.5">
                      {match.compatibility}% match
                    </span>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Sparkles size={10} className="text-primary shrink-0" />
                      {match.compatibilityNote}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
