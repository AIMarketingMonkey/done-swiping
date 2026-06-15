import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai, PROFILE_EXTRACTION_PROMPT } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { conversationId, messages } = await request.json()

  // Fetch messages from DB if conversationId provided
  let chatHistory = messages
  if (conversationId && !chatHistory) {
    const { data: dbMessages } = await supabase
      .from('ai_messages')
      .select('role, message')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    chatHistory = dbMessages?.map(m => ({ role: m.role, content: m.message })) ?? []
  }

  if (!chatHistory?.length) {
    return NextResponse.json({ error: 'No conversation found' }, { status: 400 })
  }

  // Load existing profile for multi-session accumulation
  const { data: existingProfile } = await supabase
    .from('structured_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const formattedConversation = chatHistory
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Sage'}: ${m.content}`)
    .join('\n')

  const existingProfileSection = existingProfile
    ? `EXISTING PROFILE (from all previous sessions):\n${JSON.stringify(existingProfile, null, 2)}\n\n`
    : `EXISTING PROFILE: none — this is the user's first session.\n\n`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: PROFILE_EXTRACTION_PROMPT,
      },
      {
        role: 'user',
        content: `${existingProfileSection}NEW CONVERSATION (this session):\n\n${formattedConversation}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
    temperature: 0.3,
  })

  const extracted = JSON.parse(completion.choices[0]?.message?.content ?? '{}')

  // Save merged profile back to structured_profiles
  await supabase.from('structured_profiles').upsert({
    user_id: user.id,
    personality_traits: extracted.personality_traits ?? existingProfile?.personality_traits ?? [],
    values: extracted.values ?? existingProfile?.values ?? [],
    lifestyle_tags: extracted.lifestyle_tags ?? existingProfile?.lifestyle_tags ?? [],
    relationship_goal: extracted.relationship_goal ?? existingProfile?.relationship_goal ?? null,
    relationship_structure: extracted.relationship_structure ?? existingProfile?.relationship_structure ?? null,
    communication_style: extracted.communication_style ?? existingProfile?.communication_style ?? null,
    deal_breakers: extracted.deal_breakers ?? existingProfile?.deal_breakers ?? [],
    preferred_partner_traits: extracted.preferred_partner_traits ?? existingProfile?.preferred_partner_traits ?? [],
    emotional_readiness: extracted.emotional_readiness ?? existingProfile?.emotional_readiness ?? null,
    attachment_notes: extracted.attachment_notes ?? existingProfile?.attachment_notes ?? null,
    partner_awareness: extracted.partner_awareness ?? existingProfile?.partner_awareness ?? null,
    matching_summary: extracted.matching_summary ?? existingProfile?.matching_summary ?? null,
    updated_at: new Date().toISOString(),
  })

  // Update public profile — always save completeness score, update bio/summary if present
  await supabase.from('user_profiles').upsert({
    user_id: user.id,
    ...(extracted.bio ? { bio: extracted.bio } : {}),
    ...(extracted.what_im_looking_for ? { ai_summary: extracted.what_im_looking_for } : {}),
    profile_completion_score: extracted.profile_completeness ?? existingProfile?.profile_completion_score ?? 0,
    last_ai_update: new Date().toISOString(),
  })

  return NextResponse.json({ profile: extracted })
}
