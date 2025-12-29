'use client'

import { useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useLipSync } from './useLipSync'

export function useTextToSpeech() {
  const { setSpeaking, setTalking } = useChatStore()
  const { startLipSync, stopLipSync } = useLipSync()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string) => {
    setSpeaking(true)
    setTalking(true)

    try {
      // Intentar usar ElevenLabs primero
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        // ElevenLabs disponible - usar audio
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        return new Promise<void>((resolve) => {
          const audio = new Audio(audioUrl)
          audioRef.current = audio

          audio.onplay = () => {
            startLipSync(audio)
          }

          audio.onended = () => {
            stopLipSync()
            setSpeaking(false)
            setTalking(false)
            URL.revokeObjectURL(audioUrl)
            resolve()
          }

          audio.onerror = () => {
            stopLipSync()
            setSpeaking(false)
            setTalking(false)
            URL.revokeObjectURL(audioUrl)
            // Fallback a Web Speech API
            speakWithWebSpeech(text).then(resolve)
          }

          audio.play().catch(() => {
            // Si falla, usar fallback
            speakWithWebSpeech(text).then(resolve)
          })
        })
      } else {
        // Fallback a Web Speech API
        await speakWithWebSpeech(text)
      }
    } catch (error) {
      console.error('TTS Error:', error)
      // Fallback a Web Speech API
      await speakWithWebSpeech(text)
    } finally {
      setSpeaking(false)
      setTalking(false)
    }
  }, [setSpeaking, setTalking, startLipSync, stopLipSync])

  // Fallback: Web Speech API
  const speakWithWebSpeech = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API not supported')
        resolve()
        return
      }

      // Cancelar cualquier síntesis previa
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = 1
      utterance.pitch = 1

      // Buscar una voz en español
      const voices = speechSynthesis.getVoices()
      const spanishVoice = voices.find(
        (v) => v.lang.startsWith('es') && v.name.includes('Google')
      ) || voices.find((v) => v.lang.startsWith('es'))

      if (spanishVoice) {
        utterance.voice = spanishVoice
      }

      utterance.onstart = () => {
        setTalking(true)
        // Simular lip sync básico para Web Speech
        simulateBasicLipSync()
      }

      utterance.onend = () => {
        setTalking(false)
        stopLipSync()
        resolve()
      }

      utterance.onerror = () => {
        setTalking(false)
        stopLipSync()
        resolve()
      }

      speechSynthesis.speak(utterance)
    })
  }, [setTalking, stopLipSync])

  // Simulación básica de lip-sync para Web Speech API
  const simulateBasicLipSync = useCallback(() => {
    const { setViseme } = useChatStore.getState()
    const visemes = ['viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U', 'viseme_sil']
    let index = 0

    const interval = setInterval(() => {
      if (!useChatStore.getState().isTalking) {
        clearInterval(interval)
        setViseme('viseme_sil')
        return
      }

      setViseme(visemes[index % visemes.length])
      index++
    }, 100)
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    speechSynthesis.cancel()
    stopLipSync()
    setSpeaking(false)
    setTalking(false)
  }, [setSpeaking, setTalking, stopLipSync])

  return { speak, stop }
}
