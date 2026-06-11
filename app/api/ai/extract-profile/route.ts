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

  const formattedConversation = chatHistory
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Sage'}: ${m.content}`)
    .join('\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: PROFILE_EXTRACTION_PROMPT,
      },
      {
        role: 'user',
        content: `Here is the conversation:\n\n${formattedConversation}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
    temperature: 0.3,
  })

  const extracted = JSON.parse(completion.choices[0]?.message?.content ?? '{}')

  // Save structured profile to DB
  await supabase.from('structured_profiles').upsert({
    user_id: user.id,
    personality_traits: extracted.personality_traits ?? [],
    values: extracted.values ?? [],
    lifestyle_tags: extracted.lifestyle_tags ?? [],
    relationship_goal: extracted.relationship_goal ?? null,
    communication_style: extracted.communication_style ?? null,
    deal_breakers: extracted.deal_breakers ?? [],
    preferred_partner_traits: extracted.preferred_partner_traits ?? [],
    emotional_readiness: extracted.emotional_readiness ?? null,
    attachment_notes: extracted.attachment_notes ?? null,
    sexual_compatibility_notes: extracted.sexual_compatibility_notes ?? null,
    matching_summary: extracted.matching_summary ?? null,
  })

  // Update the public profile with generated bio
  await supabase.from('user_profiles').upsert({
    user_id: user.id,
    bio: extracted.bio ?? null,
    ai_summary: extracted.what_im_looking_for ?? null,
    last_ai_update: new Date().toISOString(),
  })

  return NextResponse.json({ profile: extracted })
}
