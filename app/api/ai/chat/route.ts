import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai, SAGE_SYSTEM_PROMPT } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, conversationId, startSession } = await request.json()

  if (!startSession && (!messages || !Array.isArray(messages))) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
  }

  let convId = conversationId

  // Create conversation record if not exists
  if (!convId) {
    const { data: conv } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, conversation_type: 'onboarding' })
      .select('id')
      .single()
    convId = conv?.id
  }

  // First-session intro: generate Sage's opening without a user message
  if (startSession) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SAGE_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Please start the conversation by introducing yourself to a new user who has just joined Done Swiping and verified their email.',
        },
      ],
      max_tokens: 200,
      temperature: 0.85,
    })

    const intro = completion.choices[0]?.message?.content ?? ''

    if (convId && intro) {
      await supabase.from('ai_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        message: intro,
      })
    }

    return NextResponse.json({ reply: intro, conversationId: convId })
  }

  // Save user's last message to DB
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'user' && convId) {
    await supabase.from('ai_messages').insert({
      conversation_id: convId,
      role: 'user',
      message: lastMessage.content,
    })
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SAGE_SYSTEM_PROMPT },
      ...messages.slice(-30),
    ],
    max_tokens: 150,
    temperature: 0.85,
  })

  const reply = completion.choices[0]?.message?.content ?? ''

  if (convId) {
    await supabase.from('ai_messages').insert({
      conversation_id: convId,
      role: 'assistant',
      message: reply,
    })
  }

  return NextResponse.json({ reply, conversationId: convId })
}
