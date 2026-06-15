import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await request.json()

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  const speech = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text.trim(),
    response_format: 'mp3',
  })

  const audioBuffer = Buffer.from(await speech.arrayBuffer())

  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.byteLength),
      'Cache-Control': 'no-store',
    },
  })
}
