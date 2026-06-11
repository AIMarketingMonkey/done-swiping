import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai, DATING_ASSISTANT_SYSTEM_PROMPT } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages, conversationId } = await request.json()

  if (!messages || !Array.isArray(messages)) {
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
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: DATING_ASSISTANT_SYSTEM_PROMPT },
      ...messages.slice(-20), // keep last 20 messages for context
    ],
    max_tokens: 400,
    temperature: 0.8,
  })

  const reply = completion.choices[0]?.message?.content ?? ''

  // Save AI reply to DB
  if (convId) {
    await supabase.from('ai_messages').insert({
      conversation_id: convId,
      role: 'assistant',
      message: reply,
    })
  }

  return NextResponse.json({ reply, conversationId: convId })
}
