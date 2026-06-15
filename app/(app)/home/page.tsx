import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Heart, Sparkles, ArrowRight, Mic, Settings } from 'lucide-react'
import Link from 'next/link'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  const { data: profileData } = await supabase
    .from('user_profiles').select('*').eq('user_id', user.id).single()

  const firstName = userData?.name?.split(' ')[0]
    || user.email?.split('@')[0]
    || 'there'

  const completeness = profileData?.profile_completion_score ?? 0
  const MINIMUM_COMPLETENESS = 40

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-0.5">{formatDate()}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()},{' '}
              <span className="text-primary capitalize">{firstName}</span>
            </h1>
          </div>
          <Link href="/settings" className="p-2 -mr-1 rounded-full hover:bg-gray-100 transition-colors">
            <Settings size={20} className="text-gray-400" />
          </Link>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Profile completeness / chat prompt */}
        {completeness < MINIMUM_COMPLETENESS ? (
          <Link href="/chat">
            <div className="gradient-warm border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Mic size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">
                  {completeness === 0 ? 'Start talking to Sage' : 'Continue chatting with Sage'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {completeness === 0
                    ? 'A few conversations will unlock your matches'
                    : `${completeness}% complete — ${MINIMUM_COMPLETENESS - completeness}% more unlocks matches`}
                </p>
                {completeness > 0 && (
                  <div className="mt-2 bg-white rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                )}
              </div>
              <ArrowRight size={18} className="text-gray-400 shrink-0" />
            </div>
          </Link>
        ) : (
          <Link href="/matches">
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Heart size={20} className="text-primary fill-primary/30" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">Your matches are ready</p>
                <p className="text-xs text-gray-500 mt-0.5">Sage has found people worth meeting</p>
              </div>
              <ArrowRight size={18} className="text-gray-400 shrink-0" />
            </div>
          </Link>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/chat">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic size={18} className="text-primary" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">Talk to Sage</p>
              <p className="text-xs text-gray-400 leading-snug">Build your profile through conversation</p>
            </div>
          </Link>
          <Link href="/profile">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                <Sparkles size={18} className="text-blue-500" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">Your profile</p>
              <p className="text-xs text-gray-400 leading-snug">See what Sage knows about you</p>
            </div>
          </Link>
        </div>

        {/* How it works — shown when profile is new */}
        {completeness < 20 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">How Done Swiping works</h3>
            {[
              { step: '1', text: 'Talk to Sage — a few natural conversations, no forms' },
              { step: '2', text: 'Sage builds your compatibility profile in the background' },
              { step: '3', text: 'Get a small number of genuinely compatible matches' },
              { step: '4', text: 'Chat first, share photos when you\'re ready' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </span>
                <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
