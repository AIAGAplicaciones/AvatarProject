'use client'

import { useChatStore } from '@/store/chatStore'
import { useTextToSpeech } from './useTextToSpeech'
import { extractEmotion } from '@/config/personality'
import { Emotion } from '@/types'

export function useChat() {
  const { addMessage, setLoading, setEmotion, messages } = useChatStore()
  const { speak } = useTextToSpeech()

  const sendMessage = async (content: string) => {
    // Añadir mensaje del usuario
    addMessage({ role: 'user', content })
    setLoading(true)

    try {
      // Preparar historial para la API
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      // Llamar a nuestra API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history,
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const data = await response.json()
      const assistantMessage = data.message

      // Extraer emoción del texto
      const { cleanText, emotion } = extractEmotion(assistantMessage)

      // Actualizar emoción del avatar
      setEmotion(emotion as Emotion)

      // Añadir mensaje del asistente (sin la etiqueta de emoción)
      addMessage({ role: 'assistant', content: cleanText })

      // Reproducir con TTS
      await speak(cleanText)

      // Volver a emoción neutral después de hablar
      setTimeout(() => {
        setEmotion('neutral')
      }, 1000)

    } catch (error) {
      console.error('Error en chat:', error)
      addMessage({
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
      })
      setEmotion('sad')
    } finally {
      setLoading(false)
    }
  }

  return { sendMessage }
}
