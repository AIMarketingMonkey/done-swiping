import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // Check admin role via user metadata or a separate admin_users table
  const isAdmin = user.user_metadata?.role === 'admin' ||
    user.email?.endsWith('@doneswiping.com')
  return isAdmin ? user : null
}

export async function GET(request: NextRequest) {
  const supabase = await createAdminClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  const { data: users, count } = await supabase
    .from('users')
    .select('*, user_profiles (profile_completion_score, approved_for_matching), subscriptions (plan_name, status)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json({ users: users ?? [], total: count ?? 0, page, limit })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createAdminClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, action } = await request.json()

  switch (action) {
    case 'block':
      await supabase.from('users').update({ is_blocked: true }).eq('id', userId)
      break
    case 'unblock':
      await supabase.from('users').update({ is_blocked: false }).eq('id', userId)
      break
    case 'verify':
      await supabase.from('users').update({ is_verified: true }).eq('id', userId)
      break
    case 'delete':
      await supabase.auth.admin.deleteUser(userId)
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
