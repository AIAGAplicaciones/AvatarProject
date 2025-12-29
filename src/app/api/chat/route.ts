import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { avatarPersonality } from '@/config/personality'

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Construir mensajes para la API
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: avatarPersonality.systemPrompt,
      },
      // Historial de conversación
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      // Mensaje actual
      {
        role: 'user',
        content: message,
      },
    ]

    // Llamar a la API de OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // O 'gpt-3.5-turbo' para menor costo
      messages,
      max_tokens: 300,
      temperature: 0.7,
    })

    const assistantMessage = completion.choices[0]?.message?.content || 'No pude generar una respuesta.'

    return NextResponse.json({
      message: assistantMessage,
    })

  } catch (error) {
    console.error('Chat API Error:', error)

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI Error: ${error.message}` },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
