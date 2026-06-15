'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Sparkles, Crown, ChevronRight, Heart, AlertCircle, Settings } from 'lucide-react'
import Link from 'next/link'

const MINIMUM_COMPLETENESS = 40

interface StructuredProfile {
  personality_traits: string[]
  values: string[]
  lifestyle_tags: string[]
  relationship_goal: string | null
  relationship_structure: string | null
  communication_style: string | null
  deal_breakers: string[]
  preferred_partner_traits: string[]
  emotional_readiness: string | null
  attachment_notes: string | null
  love_languages: string[] | null
  partner_awareness: string | null
  matching_summary: string | null
}

interface ProfileData {
  user: {
    name: string
    subscription_status: string
  } | null
  profile: {
    bio: string | null
    ai_summary: string | null
    profile_completion_score: number
  } | null
  structured: StructuredProfile | null
}

function Pill({ text, color = 'rose' }: { text: string; color?: 'rose' | 'blue' | 'green' | 'amber' | 'purple' }) {
  const colors = {
    rose: 'bg-primary/10 text-primary',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {text}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

function completenessLabel(score: number) {
  if (score === 0) return "Sage doesn't know you yet"
  if (score < 20) return 'Just getting started'
  if (score < MINIMUM_COMPLETENESS) return 'Getting there — a few more sessions will help'
  if (score < 60) return 'Good start — Sage has a useful picture'
  if (score < 80) return 'Strong profile — matches will be meaningful'
  return 'Excellent — Sage knows you well'
}

function completenessColor(score: number) {
  if (score < MINIMUM_COMPLETENESS) return 'bg-amber-400'
  if (score < 60) return 'bg-primary'
  return 'bg-green-500'
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
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white px-5 pt-12 pb-5 shadow-sm">
          <div className="skeleton h-7 w-32 rounded mb-4" />
          <div className="skeleton h-3 w-full rounded-full" />
        </div>
        <div className="px-4 pt-4 space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const { user, profile, structured } = data ?? {}
  const completeness = profile?.profile_completion_score ?? 0
  const isPremium = user?.subscription_status === 'premium'
  const hasAnything = structured && (
    structured.relationship_goal ||
    (structured.values?.length ?? 0) > 0 ||
    (structured.personality_traits?.length ?? 0) > 0 ||
    structured.matching_summary
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          {isPremium && (
            <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1 rounded-full">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Premium</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">What Sage knows about you</p>
          <Link href="/settings" className="p-1.5 -mr-1 rounded-full hover:bg-gray-100 transition-colors">
            <Settings size={18} className="text-gray-400" />
          </Link>
        </div>

        {/* Completeness bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">{completenessLabel(completeness)}</span>
            <span className={`text-sm font-bold ${completeness >= MINIMUM_COMPLETENESS ? 'text-primary' : 'text-amber-600'}`}>
              {completeness}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${completenessColor(completeness)}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < MINIMUM_COMPLETENESS && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Matches unlock at {MINIMUM_COMPLETENESS}% — chat with Sage a little more
            </p>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!hasAnything ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center mb-5 shadow-sm">
            <span className="text-3xl font-bold text-primary">S</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Sage is ready to learn about you</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Have a conversation with Sage and your profile will build up here automatically — no forms, just talking.
          </p>
          <button
            onClick={() => router.push('/chat')}
            className="flex items-center gap-2.5 bg-primary text-white px-8 py-4 rounded-2xl font-semibold shadow-md active:scale-95 transition-transform"
          >
            <Mic className="w-5 h-5" />
            Start talking to Sage
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3">

          {/* Bio */}
          {profile?.bio && (
            <Section title="About me">
              <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
            </Section>
          )}

          {/* What I'm looking for */}
          {profile?.ai_summary && (
            <Section title="What I'm looking for">
              <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{profile.ai_summary}&rdquo;</p>
            </Section>
          )}

          {/* Relationship goal + structure */}
          {(structured?.relationship_goal || structured?.relationship_structure) && (
            <Section title="Relationship">
              {structured.relationship_goal && (
                <p className="text-sm text-gray-700 mb-2">{structured.relationship_goal}</p>
              )}
              {structured.relationship_structure && (
                <Pill text={structured.relationship_structure} color="purple" />
              )}
            </Section>
          )}

          {/* Values */}
          {(structured?.values?.length ?? 0) > 0 && (
            <Section title="Values">
              <div className="flex flex-wrap gap-2">
                {structured?.values?.map(v => <Pill key={v} text={v} color="blue" />)}
              </div>
            </Section>
          )}

          {/* Personality */}
          {(structured?.personality_traits?.length ?? 0) > 0 && (
            <Section title="Personality">
              <div className="flex flex-wrap gap-2">
                {structured?.personality_traits?.map(t => <Pill key={t} text={t} color="rose" />)}
              </div>
            </Section>
          )}

          {/* Lifestyle */}
          {(structured?.lifestyle_tags?.length ?? 0) > 0 && (
            <Section title="Lifestyle">
              <div className="flex flex-wrap gap-2">
                {structured?.lifestyle_tags?.map(t => <Pill key={t} text={t} color="green" />)}
              </div>
            </Section>
          )}

          {/* Communication */}
          {structured?.communication_style && (
            <Section title="Communication style">
              <p className="text-sm text-gray-700 leading-relaxed">{structured.communication_style}</p>
            </Section>
          )}

          {/* Emotional readiness */}
          {structured?.emotional_readiness && (
            <Section title="Where I am right now">
              <p className="text-sm text-gray-700 leading-relaxed">{structured.emotional_readiness}</p>
            </Section>
          )}

          {/* Love languages */}
          {(structured?.love_languages?.length ?? 0) > 0 && (
            <Section title="Love languages">
              <div className="flex flex-wrap gap-2">
                {structured?.love_languages?.map(l => <Pill key={l} text={l} color="amber" />)}
              </div>
            </Section>
          )}

          {/* What I want in a partner */}
          {(structured?.preferred_partner_traits?.length ?? 0) > 0 && (
            <Section title="What I'm looking for in a partner">
              <div className="flex flex-wrap gap-2">
                {structured?.preferred_partner_traits?.map(t => <Pill key={t} text={t} color="rose" />)}
              </div>
            </Section>
          )}

          {/* Deal-breakers */}
          {(structured?.deal_breakers?.length ?? 0) > 0 && (
            <Section title="Deal-breakers">
              <div className="flex flex-wrap gap-2">
                {structured?.deal_breakers?.map(d => (
                  <span key={d} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {d}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Attachment notes — shown gently, not clinically */}
          {structured?.attachment_notes && (
            <Section title="In relationships, Sage noticed">
              <p className="text-sm text-gray-700 leading-relaxed">{structured.attachment_notes}</p>
            </Section>
          )}

          {/* Sage's matching take */}
          {structured?.matching_summary && (
            <div className="gradient-warm rounded-2xl p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Sage&apos;s take</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{structured.matching_summary}</p>
            </div>
          )}

          {/* Upgrade nudge */}
          {!isPremium && (
            <button className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 hover:border-amber-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <Crown className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-amber-900 block">Upgrade to Premium</span>
                  <span className="text-xs text-amber-700">Unlimited matches from £14.99/month</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600" />
            </button>
          )}

        </div>
      )}

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-3 pt-2 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent">
        <button
          onClick={() => router.push('/chat')}
          className="w-full flex items-center justify-center gap-2.5 bg-primary text-white py-4 rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform"
        >
          <Mic className="w-5 h-5" />
          {hasAnything ? 'Talk to Sage to update this' : 'Start talking to Sage'}
        </button>
        {hasAnything && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Tell Sage anything that doesn&apos;t look right and it will be updated
          </p>
        )}
      </div>
    </div>
  )
}
