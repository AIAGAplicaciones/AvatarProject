'use client'

import { useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'

// Mapeo de caracteres/fonemas españoles a visemas de Oculus
const charToViseme: Record<string, string> = {
  // Vocales
  'a': 'viseme_aa', 'á': 'viseme_aa',
  'e': 'viseme_E', 'é': 'viseme_E',
  'i': 'viseme_I', 'í': 'viseme_I', 'y': 'viseme_I',
  'o': 'viseme_O', 'ó': 'viseme_O',
  'u': 'viseme_U', 'ú': 'viseme_U', 'ü': 'viseme_U',

  // Consonantes labiales (p, b, m)
  'p': 'viseme_PP', 'b': 'viseme_PP', 'm': 'viseme_PP',

  // Consonantes labiodentales (f, v)
  'f': 'viseme_FF', 'v': 'viseme_FF',

  // Consonantes dentales/alveolares (t, d, n, l)
  't': 'viseme_DD', 'd': 'viseme_DD', 'n': 'viseme_nn', 'l': 'viseme_nn',

  // Consonantes velares (k, g, j)
  'k': 'viseme_kk', 'g': 'viseme_kk', 'q': 'viseme_kk',
  'j': 'viseme_CH', 'x': 'viseme_kk', 'c': 'viseme_kk',

  // Consonantes fricativas (s, z)
  's': 'viseme_SS', 'z': 'viseme_SS',

  // Consonantes africadas (ch)
  'h': 'viseme_CH',

  // Vibrantes (r, rr)
  'r': 'viseme_RR',

  // Consonantes interdentales (z en español de España, th)
  'ñ': 'viseme_nn',

  // Silencio/espacios
  ' ': 'viseme_sil', '.': 'viseme_sil', ',': 'viseme_sil',
  '!': 'viseme_sil', '?': 'viseme_sil', ':': 'viseme_sil',
}

// Convertir texto a secuencia de visemas
function textToVisemes(text: string): string[] {
  const visemes: string[] = []
  const lowerText = text.toLowerCase()

  for (let i = 0; i < lowerText.length; i++) {
    const char = lowerText[i]
    const viseme = charToViseme[char] || 'viseme_sil'
    visemes.push(viseme)
  }

  return visemes
}

export function useLipSync() {
  const animationFrameRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const visemeIndexRef = useRef(0)
  const visemesRef = useRef<string[]>([])

  // Iniciar lip sync basado en texto sincronizado con audio
  const startLipSyncWithText = useCallback((text: string, audioDuration: number) => {
    const { setViseme } = useChatStore.getState()

    // Convertir texto a visemas
    const visemes = textToVisemes(text)
    visemesRef.current = visemes
    visemeIndexRef.current = 0

    if (visemes.length === 0) return

    // Calcular intervalo entre visemas basado en la duración del audio
    // Asumimos ~10 caracteres por segundo de habla normal
    const intervalMs = Math.max(50, (audioDuration * 1000) / visemes.length)

    // Reproducir visemas sincronizados
    intervalRef.current = setInterval(() => {
      if (visemeIndexRef.current >= visemes.length) {
        stopLipSync()
        return
      }

      const currentViseme = visemes[visemeIndexRef.current]
      setViseme(currentViseme)
      visemeIndexRef.current++
    }, intervalMs)
  }, [])

  // Lip sync simple basado en análisis de volumen del audio
  const startLipSync = useCallback((audio: HTMLAudioElement, text?: string) => {
    const { setViseme } = useChatStore.getState()

    // Si tenemos el texto, usar lip sync basado en texto
    if (text && audio.duration) {
      startLipSyncWithText(text, audio.duration)
      return
    }

    // Fallback: lip sync basado en análisis de audio simplificado
    const visemes = ['viseme_sil', 'viseme_aa', 'viseme_E', 'viseme_O', 'viseme_U', 'viseme_I']
    let lastTime = 0
    let visemeIndex = 0

    const analyze = () => {
      const state = useChatStore.getState()
      if (!state.isTalking || audio.paused || audio.ended) {
        setViseme('viseme_sil')
        return
      }

      // Cambiar visema basado en el tiempo transcurrido
      const currentTime = audio.currentTime
      if (currentTime - lastTime > 0.08) { // ~12 visemas por segundo
        lastTime = currentTime
        // Alternar entre visemas de forma más natural
        const randomOffset = Math.floor(Math.random() * 3)
        visemeIndex = (visemeIndex + 1 + randomOffset) % visemes.length
        setViseme(visemes[visemeIndex])
      }

      animationFrameRef.current = requestAnimationFrame(analyze)
    }

    analyze()
  }, [startLipSyncWithText])

  const stopLipSync = useCallback(() => {
    const { setViseme } = useChatStore.getState()

    // Limpiar animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Limpiar interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Resetear estado
    visemeIndexRef.current = 0
    visemesRef.current = []

    setViseme('viseme_sil')
  }, [])

  return { startLipSync, startLipSyncWithText, stopLipSync }
}
