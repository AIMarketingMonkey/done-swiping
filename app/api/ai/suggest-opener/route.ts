import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { matchUserId } = await request.json()

  const [myRes, theirRes] = await Promise.all([
    supabase.from('structured_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('structured_profiles').select('*').eq('user_id', matchUserId).single(),
  ])

  const myProfile = myRes.data
  const theirProfile = theirRes.data

  const prompt = `You are helping write a warm, genuine opening message for a dating app.

My profile:
- Personality: ${myProfile?.personality_traits?.join(', ')}
- Values: ${myProfile?.values?.join(', ')}
- Lifestyle: ${myProfile?.lifestyle_tags?.join(', ')}

Their profile:
- Personality: ${theirProfile?.personality_traits?.join(', ')}
- Values: ${theirProfile?.values?.join(', ')}
- Lifestyle: ${theirProfile?.lifestyle_tags?.join(', ')}

Write ONE natural, warm opening message (2-3 sentences max). It should reference something specific we have in common, feel genuine (not generic), and invite a response. Don't be cheesy. Don't say "Hey" or "Hi there".`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.9,
  })

  const suggestion = completion.choices[0]?.message?.content ?? ''

  return NextResponse.json({ suggestion })
}
