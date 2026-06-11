import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const sortOrder = parseInt(formData.get('sort_order') as string ?? '0')

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type and size
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  // Check existing photo count
  const { count } = await supabase
    .from('profile_photos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 6) {
    return NextResponse.json({ error: 'Maximum 6 photos allowed' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${uuidv4()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(fileName)

  const isPrimary = (count ?? 0) === 0

  const { data: photo } = await supabase.from('profile_photos').insert({
    user_id: user.id,
    image_url: publicUrl,
    sort_order: sortOrder,
    is_primary: isPrimary,
    moderation_status: 'pending',
  }).select().single()

  return NextResponse.json({ photo })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photoId } = await request.json()

  const { data: photo } = await supabase
    .from('profile_photos')
    .select('image_url')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single()

  if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  // Extract storage path from URL
  const url = new URL(photo.image_url)
  const storagePath = url.pathname.split('/profile-photos/')[1]
  if (storagePath) {
    await supabase.storage.from('profile-photos').remove([storagePath])
  }

  await supabase.from('profile_photos').delete().eq('id', photoId).eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
