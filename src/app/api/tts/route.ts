import { NextRequest, NextResponse } from 'next/server'
import { avatarPersonality } from '@/config/personality'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

    // Si no hay API key de ElevenLabs, retornar error para usar fallback
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured. Using Web Speech API fallback.' },
        { status: 503 }
      )
    }

    // Usar voiceId proporcionado o el configurado por defecto
    const selectedVoiceId = voiceId || avatarPersonality.voiceId

    // Llamar a la API de ElevenLabs
    const response = await fetch(`${ELEVENLABS_API_URL}/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Modelo multilingüe de alta calidad
        voice_settings: {
          stability: 0.35,          // Más bajo = más expresivo y natural
          similarity_boost: 0.85,   // Alto para mantener consistencia
          style: 0.6,               // Más estilo expresivo
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('ElevenLabs API Error:', error)

      return NextResponse.json(
        { error: 'Error generating speech' },
        { status: response.status }
      )
    }

    // Obtener el audio como ArrayBuffer
    const audioBuffer = await response.arrayBuffer()

    // Retornar el audio como respuesta
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('TTS API Error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
