import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Heart, Sparkles, ArrowRight, Camera } from 'lucide-react'
import Link from 'next/link'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

const mockMatches = [
  {
    id: '1',
    name: 'Sarah',
    age: 42,
    compatibility: 94,
    bio: 'Loves hiking, cooking Italian food, and weekend farmers markets.',
    compatibilityNote: 'You both value quality time and outdoor adventures',
    photoColor: 'from-rose-200 to-pink-300',
  },
  {
    id: '2',
    name: 'Michael',
    age: 48,
    compatibility: 88,
    bio: 'Jazz enthusiast, amateur photographer, dog dad to a golden retriever.',
    compatibilityNote: 'Shared love of music and creative expression',
    photoColor: 'from-amber-200 to-orange-300',
  },
  {
    id: '3',
    name: 'Elena',
    age: 39,
    compatibility: 91,
    bio: 'Yoga instructor who loves travel, art museums, and great conversations.',
    compatibilityNote: 'Both seek meaningful connection and mindful living',
    photoColor: 'from-purple-200 to-violet-300',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const firstName = profile?.first_name || user.email?.split('@')[0] || 'there'
  const profileCompletion = profile?.completion_percentage || 45
  const showCompletionCard = profileCompletion < 80

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 shadow-sm">
        <p className="text-sm text-gray-500 mb-0.5">{formatDate()}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()},{' '}
          <span className="text-primary capitalize">{firstName}</span> 👋
        </h1>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Profile completion card */}
        {showCompletionCard && (
          <Link href="/profile">
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Camera size={22} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">Complete your profile</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {profileCompletion}% done — add more to get better matches
                </p>
                <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              <ArrowRight size={18} className="text-gray-400 shrink-0" />
            </div>
          </Link>
        )}

        {/* Today's Matches */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Heart size={18} className="text-primary fill-primary" />
              Today's Matches
            </h2>
            <Link href="/matches" className="text-sm text-primary font-medium">
              See all
            </Link>
          </div>

          <div className="space-y-3">
            {mockMatches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex gap-0">
                  {/* Photo placeholder */}
                  <div className={`w-24 shrink-0 bg-gradient-to-br ${match.photoColor} flex items-center justify-center`}>
                    <span className="text-3xl font-bold text-white/80">
                      {match.name[0]}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-gray-900">{match.name}</span>
                        <span className="text-gray-500 text-sm">, {match.age}</span>
                      </div>
                      <span className="shrink-0 bg-rose-50 text-primary text-xs font-bold px-2 py-0.5 rounded-full border border-rose-100">
                        {match.compatibility}% match
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{match.bio}</p>
                    <p className="text-xs text-primary/80 mt-1.5 flex items-center gap-1">
                      <Sparkles size={11} className="shrink-0" />
                      {match.compatibilityNote}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Dating Insight */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Dating Insight</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Profiles with 4+ photos get 3× more matches. Your genuine smile matters most!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
