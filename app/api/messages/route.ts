import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, user1_id, user2_id, last_message_at,
      user1:user1_id (id, name, profile_photos (image_url, is_primary)),
      user2:user2_id (id, name, profile_photos (image_url, is_primary)),
      messages (message_text, created_at, sender_id, read_at)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const formatted = (conversations ?? []).map((conv: any) => {
    const isUser1 = conv.user1_id === user.id
    const otherUser = isUser1 ? conv.user2 : conv.user1

    const messages = [...(conv.messages ?? [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastMessage = messages[0]
    const unreadCount = messages.filter(
      (m: any) => m.sender_id !== user.id && !m.read_at
    ).length

    const primaryPhoto = otherUser?.profile_photos?.find((p: any) => p.is_primary)?.image_url
      ?? otherUser?.profile_photos?.[0]?.image_url ?? null

    return {
      id: conv.id,
      other_user: {
        id: otherUser?.id,
        name: otherUser?.name ?? 'Match',
        photo: primaryPhoto,
      },
      last_message: lastMessage?.message_text ?? null,
      last_message_at: lastMessage?.created_at ?? conv.last_message_at,
      unread_count: unreadCount,
    }
  })

  return NextResponse.json({ conversations: formatted })
}
