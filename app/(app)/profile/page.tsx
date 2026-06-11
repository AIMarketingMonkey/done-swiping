'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera, MessageCircle, MapPin, Edit2, CheckCircle,
  Sparkles, Crown, ChevronRight, Heart
} from 'lucide-react'

interface ProfileData {
  user: {
    name: string
    date_of_birth: string | null
    location: string | null
    gender: string | null
    subscription_status: string
    is_verified: boolean
  } | null
  profile: {
    bio: string | null
    ai_summary: string | null
    profile_completion_score: number
    approved_for_matching: boolean
  } | null
  structured: {
    personality_traits: string[]
    values: string[]
    lifestyle_tags: string[]
    relationship_goal: string | null
    communication_style: string | null
    deal_breakers: string[]
    matching_summary: string | null
  } | null
  photos: { id: string; image_url: string; is_primary: boolean; sort_order: number }[]
}

function getAge(dob: string | null) {
  if (!dob) return null
  return new Date().getFullYear() - new Date(dob).getFullYear()
}

function Pill({ text, color = 'rose' }: { text: string; color?: 'rose' | 'blue' | 'green' | 'amber' }) {
  const colors = {
    rose: 'bg-primary/10 text-primary',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {text}
    </span>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="app-shell pb-20">
        <div className="h-64 skeleton" />
        <div className="px-4 pt-4 space-y-3">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
      </div>
    )
  }

  const { user, profile, structured, photos } = data ?? {}
  const primaryPhoto = photos?.find(p => p.is_primary) ?? photos?.[0]
  const completionScore = profile?.profile_completion_score ?? 0
  const age = getAge(user?.date_of_birth ?? null)
  const isPremium = user?.subscription_status === 'premium'

  return (
    <div className="app-shell pb-24">
      {/* Hero photo */}
      <div className="relative h-80 bg-muted">
        {primaryPhoto ? (
          <img src={primaryPhoto.image_url} alt={user?.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-warm flex items-center justify-center">
            <Camera className="w-12 h-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user?.name}{age ? `, ${age}` : ''}
              {user?.is_verified && (
                <CheckCircle className="inline-block w-5 h-5 ml-1.5 text-blue-400 fill-blue-400" />
              )}
            </h1>
            {user?.location && (
              <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{user.location}</span>
              </div>
            )}
          </div>
          {isPremium && (
            <div className="flex items-center gap-1.5 bg-amber-400/90 px-3 py-1.5 rounded-full">
              <Crown className="w-3.5 h-3.5 text-amber-900" />
              <span className="text-xs font-semibold text-amber-900">Premium</span>
            </div>
          )}
        </div>
      </div>

      {/* Photo strip */}
      {(photos?.length ?? 0) > 1 && (
        <div className="px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos?.map(photo => (
              <img
                key={photo.id}
                src={photo.image_url}
                alt=""
                className="w-16 h-16 rounded-xl object-cover shrink-0 border-2 border-white shadow-sm"
              />
            ))}
            <button
              onClick={() => router.push('/settings')}
              className="w-16 h-16 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center shrink-0"
            >
              <Camera className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        {/* Profile completion */}
        {completionScore < 80 && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Profile completion</span>
              <span className="text-sm font-bold text-primary">{completionScore}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${completionScore}%` }} />
            </div>
            <button
              onClick={() => router.push('/ai-chat')}
              className="mt-3 flex items-center gap-2 text-sm text-primary font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Continue AI profile conversation
            </button>
          </div>
        )}

        {/* Bio */}
        {profile?.bio && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground text-sm">About me</h3>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-foreground text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* AI profile summary */}
        {profile?.ai_summary && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">What I&apos;m looking for</h3>
            </div>
            <p className="text-foreground text-sm leading-relaxed italic">&ldquo;{profile.ai_summary}&rdquo;</p>
          </div>
        )}

        {/* Personality traits */}
        {(structured?.personality_traits?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground text-sm mb-3">Personality</h3>
            <div className="flex flex-wrap gap-2">
              {structured?.personality_traits?.map(t => <Pill key={t} text={t} color="rose" />)}
            </div>
          </div>
        )}

        {/* Values */}
        {(structured?.values?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground text-sm mb-3">Values</h3>
            <div className="flex flex-wrap gap-2">
              {structured?.values?.map(v => <Pill key={v} text={v} color="blue" />)}
            </div>
          </div>
        )}

        {/* Lifestyle */}
        {(structured?.lifestyle_tags?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <h3 className="font-semibold text-foreground text-sm mb-3">Lifestyle</h3>
            <div className="flex flex-wrap gap-2">
              {structured?.lifestyle_tags?.map(t => <Pill key={t} text={t} color="green" />)}
            </div>
          </div>
        )}

        {/* Matching summary */}
        {structured?.matching_summary && (
          <div className="gradient-warm rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">AI matching note</h3>
            </div>
            <p className="text-foreground/80 text-sm leading-relaxed">{structured.matching_summary}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pb-2">
          <button
            onClick={() => router.push('/ai-chat')}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Continue AI conversation</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {!isPremium && (
            <button className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 hover:border-amber-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <Crown className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-amber-900 block">Upgrade to Premium</span>
                  <span className="text-xs text-amber-700">From £9.99/month</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
