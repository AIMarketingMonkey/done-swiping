import type { StructuredProfile, UserPreferences, User } from '@/lib/types/database'

export interface MatchCandidate {
  user: User
  profile: StructuredProfile
  preferences: UserPreferences
  photos: { image_url: string; is_primary: boolean }[]
  bio: string | null
  ai_summary: string | null
}

export interface MatchScore {
  total: number
  breakdown: {
    location: number
    age: number
    relationship_goal: number
    values: number
    lifestyle: number
    communication: number
    deal_breakers: number
  }
  explanation: string[]
}

const WEIGHTS = {
  location: 0.15,
  age: 0.10,
  relationship_goal: 0.20,
  values: 0.20,
  lifestyle: 0.15,
  communication: 0.10,
  deal_breakers: 0.10,
}

function arrayOverlap(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0.5
  const aLower = a.map(x => x.toLowerCase())
  const bLower = b.map(x => x.toLowerCase())
  const intersection = aLower.filter(x => bLower.some(y => y.includes(x) || x.includes(y)))
  return intersection.length / Math.max(a.length, b.length)
}

function scoreRelationshipGoal(goal1: string | null, goal2: string | null): number {
  if (!goal1 || !goal2) return 0.5
  const normalized1 = goal1.toLowerCase()
  const normalized2 = goal2.toLowerCase()
  if (normalized1 === normalized2) return 1
  const seriousTerms = ['long term', 'marriage', 'serious', 'committed', 'forever']
  const casualTerms = ['casual', 'dating', 'see what happens', 'open']
  const is1Serious = seriousTerms.some(t => normalized1.includes(t))
  const is2Serious = seriousTerms.some(t => normalized2.includes(t))
  const is1Casual = casualTerms.some(t => normalized1.includes(t))
  const is2Casual = casualTerms.some(t => normalized2.includes(t))
  if (is1Serious && is2Serious) return 0.9
  if (is1Casual && is2Casual) return 0.8
  if ((is1Serious && is2Casual) || (is1Casual && is2Serious)) return 0.2
  return 0.5
}

function scoreDealBreakers(myDealBreakers: string[], theirTraits: string[]): number {
  if (!myDealBreakers?.length) return 1
  const dealBreakersLower = myDealBreakers.map(d => d.toLowerCase())
  const traitsLower = theirTraits.map(t => t.toLowerCase())
  const triggered = dealBreakersLower.filter(db =>
    traitsLower.some(t => t.includes(db) || db.includes(t))
  )
  if (triggered.length > 0) return 0
  return 1
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function calculateCompatibilityScore(
  myProfile: StructuredProfile,
  myPrefs: UserPreferences,
  myUser: User,
  theirProfile: StructuredProfile,
  theirPrefs: UserPreferences,
  theirUser: User
): MatchScore {
  const breakdown = {
    location: 0,
    age: 0,
    relationship_goal: 0,
    values: 0,
    lifestyle: 0,
    communication: 0,
    deal_breakers: 0,
  }

  const explanation: string[] = []

  // Location score
  if (myUser.latitude && myUser.longitude && theirUser.latitude && theirUser.longitude) {
    const distance = haversineDistance(
      myUser.latitude, myUser.longitude,
      theirUser.latitude, theirUser.longitude
    )
    const maxDist = myPrefs.max_distance || 50
    breakdown.location = Math.max(0, 1 - distance / maxDist)
    if (breakdown.location > 0.7) explanation.push(`You're both nearby`)
  } else {
    breakdown.location = 0.5
  }

  // Age score
  if (theirUser.date_of_birth) {
    const theirAge = new Date().getFullYear() - new Date(theirUser.date_of_birth).getFullYear()
    const inRange = theirAge >= (myPrefs.min_age || 18) && theirAge <= (myPrefs.max_age || 99)
    breakdown.age = inRange ? 1 : 0
  } else {
    breakdown.age = 0.5
  }

  // Relationship goal
  breakdown.relationship_goal = scoreRelationshipGoal(
    myProfile.relationship_goal,
    theirProfile.relationship_goal
  )
  if (breakdown.relationship_goal > 0.7) {
    explanation.push(`You're both looking for ${myProfile.relationship_goal || 'a similar kind of relationship'}`)
  }

  // Values alignment
  breakdown.values = arrayOverlap(myProfile.values, theirProfile.values)
  if (breakdown.values > 0.4) {
    const shared = myProfile.values?.filter(v =>
      theirProfile.values?.some(tv => tv.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(tv.toLowerCase()))
    ).slice(0, 3)
    if (shared?.length) {
      explanation.push(`You share values like ${shared.join(', ')}`)
    }
  }

  // Lifestyle compatibility
  breakdown.lifestyle = arrayOverlap(myProfile.lifestyle_tags, theirProfile.lifestyle_tags)
  if (breakdown.lifestyle > 0.4) explanation.push(`Your lifestyles are compatible`)

  // Communication style
  const commMatch = myProfile.communication_style && theirProfile.communication_style
    ? myProfile.communication_style.toLowerCase().split(' ').filter(w =>
        theirProfile.communication_style!.toLowerCase().includes(w)
      ).length > 0 ? 0.8 : 0.5
    : 0.5
  breakdown.communication = commMatch

  // Deal breakers — check both ways
  const myDealBreakersOk = scoreDealBreakers(
    myProfile.deal_breakers,
    [...(theirProfile.personality_traits || []), ...(theirProfile.lifestyle_tags || [])]
  )
  const theirDealBreakersOk = scoreDealBreakers(
    theirProfile.deal_breakers,
    [...(myProfile.personality_traits || []), ...(myProfile.lifestyle_tags || [])]
  )
  breakdown.deal_breakers = myDealBreakersOk * theirDealBreakersOk

  if (breakdown.deal_breakers === 0) {
    explanation.length = 0
    explanation.push('Compatibility flags detected')
  }

  const total = Object.entries(breakdown).reduce((sum, [key, value]) => {
    return sum + value * WEIGHTS[key as keyof typeof WEIGHTS]
  }, 0)

  return { total: Math.round(total * 100), breakdown, explanation }
}
