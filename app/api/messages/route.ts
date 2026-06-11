import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      other_user:user1_id (id, name, profile_photos (image_url, is_primary)),
      messages (message_text, created_at, sender_id, read_at)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  // Format conversations with other party's info
  const formatted = conversations?.map(conv => {
    const isUser1 = conv.user1_id === user.id
    const messages = (conv.messages as any[]).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastMessage = messages[0]
    const unreadCount = messages.filter(
      m => m.sender_id !== user.id && !m.read_at
    ).length

    return {
      id: conv.id,
      other_user_id: isUser1 ? conv.user2_id : conv.user1_id,
      last_message: lastMessage?.message_text ?? null,
      last_message_at: lastMessage?.created_at ?? conv.created_at,
      unread_count: unreadCount,
    }
  }) ?? []

  return NextResponse.json({ conversations: formatted })
}
