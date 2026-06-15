import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const audioBlob = formData.get('audio') as Blob | null

  if (!audioBlob || audioBlob.size === 0) {
    return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
  }

  const mimeType = audioBlob.type || 'audio/webm'
  const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
  const file = new File([audioBlob], `recording.${extension}`, { type: mimeType })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  })

  const text = transcription.text.trim()

  if (!text) {
    return NextResponse.json({ text: '', empty: true })
  }

  return NextResponse.json({ text })
}
