import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profileRes, structuredRes, photosRes, prefsRes, userRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('structured_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('profile_photos').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    supabase.from('users').select('*').eq('id', user.id).single(),
  ])

  return NextResponse.json({
    profile: profileRes.data,
    structured: structuredRes.data,
    photos: photosRes.data ?? [],
    preferences: prefsRes.data,
    user: userRes.data,
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Update user_profiles
  if (body.profile) {
    await supabase.from('user_profiles').upsert({ user_id: user.id, ...body.profile })
  }

  // Update structured profile
  if (body.structured) {
    await supabase.from('structured_profiles').upsert({ user_id: user.id, ...body.structured })
  }

  // Update basic user info
  if (body.user) {
    await supabase.from('users').update(body.user).eq('id', user.id)
  }

  // Approve for matching
  if (body.approve) {
    await supabase.from('user_profiles').upsert({
      user_id: user.id,
      approved_for_matching: true,
    })
    await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id)
  }

  return NextResponse.json({ success: true })
}
