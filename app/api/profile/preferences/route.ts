import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  await supabase.from('user_preferences').upsert({
    user_id: user.id,
    min_age: body.min_age ?? 30,
    max_age: body.max_age ?? 60,
    max_distance: body.max_distance ?? 50,
    has_children_preference: body.has_children_preference ?? null,
    smoking_preference: body.smoking_preference ?? null,
    drinking_preference: body.drinking_preference ?? null,
  })

  return NextResponse.json({ success: true })
}
