import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCompatibilityScore } from '@/lib/matching/engine'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') ?? 'all'

  // Get existing match records
  if (filter !== 'generate') {
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        *,
        matched_user:matched_user_id (
          id, name, date_of_birth, location,
          user_profiles!inner (bio, ai_summary, profile_completion_score, approved_for_matching),
          profile_photos (image_url, is_primary, sort_order)
        )
      `)
      .eq('user_id', user.id)
      .in('status', filter === 'mutual' ? ['mutual'] : ['pending', 'mutual'])
      .order('compatibility_score', { ascending: false })
      .limit(50)

    return NextResponse.json({ matches: matches ?? [] })
  }

  // Generate new matches
  const [myProfileRes, myPrefsRes, myUserRes] = await Promise.all([
    supabase.from('structured_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    supabase.from('users').select('*').eq('id', user.id).single(),
  ])

  if (!myProfileRes.data || !myUserRes.data) {
    return NextResponse.json({ error: 'Complete your profile first' }, { status: 400 })
  }

  const myPrefs = myPrefsRes.data
  const interestedIn = myPrefs?.interested_in ?? 'everyone'

  // Get already liked/passed users
  const { data: alreadyActed } = await supabase
    .from('likes')
    .select('to_user_id')
    .eq('from_user_id', user.id)

  const excludeIds = [user.id, ...(alreadyActed?.map(l => l.to_user_id) ?? [])]

  // Find candidates based on basic preferences
  let candidateQuery = supabase
    .from('users')
    .select(`
      *,
      user_profiles!inner (bio, ai_summary, approved_for_matching),
      user_preferences (interested_in, relationship_goal, min_age, max_age),
      structured_profiles (*)
    `)
    .eq('is_blocked', false)
    .eq('user_profiles.approved_for_matching', true)
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(100)

  if (interestedIn === 'men') {
    candidateQuery = candidateQuery.eq('gender', 'man')
  } else if (interestedIn === 'women') {
    candidateQuery = candidateQuery.eq('gender', 'woman')
  }

  const { data: candidates } = await candidateQuery

  if (!candidates?.length) {
    return NextResponse.json({ matches: [] })
  }

  // Score each candidate
  const scored = candidates
    .filter(c => c.structured_profiles && c.user_preferences)
    .map(c => {
      const score = calculateCompatibilityScore(
        myProfileRes.data!,
        myPrefs ?? {} as any,
        myUserRes.data!,
        c.structured_profiles as any,
        c.user_preferences as any,
        c as any
      )
      return { candidate: c, score }
    })
    .filter(s => s.score.total >= 30)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 20)

  // Upsert match records
  const matchInserts = scored.map(({ candidate, score }) => ({
    user_id: user.id,
    matched_user_id: candidate.id,
    compatibility_score: score.total,
    match_reason: score.explanation.join('. '),
    status: 'pending' as const,
  }))

  if (matchInserts.length > 0) {
    await supabase.from('matches').upsert(matchInserts, {
      onConflict: 'user_id,matched_user_id',
      ignoreDuplicates: true,
    })
  }

  return NextResponse.json({
    matches: scored.map(({ candidate, score }) => ({
      matched_user: candidate,
      compatibility_score: score.total,
      match_reason: score.explanation.join('. '),
      explanation_breakdown: score.explanation,
    })),
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetUserId, action } = await request.json()

  if (!targetUserId || !['liked', 'passed', 'saved'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await supabase.from('likes').upsert({
    from_user_id: user.id,
    to_user_id: targetUserId,
    status: action,
  }, { onConflict: 'from_user_id,to_user_id' })

  // Check for mutual like
  let isMutual = false
  if (action === 'liked') {
    const { data: theirLike } = await supabase
      .from('likes')
      .select('status')
      .eq('from_user_id', targetUserId)
      .eq('to_user_id', user.id)
      .eq('status', 'liked')
      .single()

    if (theirLike) {
      isMutual = true
      // Update both match records to mutual
      await supabase.from('matches')
        .update({ status: 'mutual' })
        .or(`and(user_id.eq.${user.id},matched_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},matched_user_id.eq.${user.id})`)

      // Create a conversation
      const existingConv = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
        .single()

      if (!existingConv.data) {
        await supabase.from('conversations').insert({
          user1_id: user.id,
          user2_id: targetUserId,
        })
      }
    }
  }

  return NextResponse.json({ success: true, mutual: isMutual })
}
