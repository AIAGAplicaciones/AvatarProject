'use client'

import { useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'

// Mapeo de rangos de frecuencia a visemas
// Basado en análisis simplificado de audio
const frequencyToViseme = (dominantFreq: number, volume: number): string => {
  if (volume < 0.1) return 'viseme_sil'

  // Mapeo aproximado de frecuencias a sonidos vocales
  if (dominantFreq < 400) return 'viseme_U'      // Sonidos graves: u, o
  if (dominantFreq < 600) return 'viseme_O'      // o
  if (dominantFreq < 800) return 'viseme_aa'     // a
  if (dominantFreq < 1200) return 'viseme_E'     // e
  if (dominantFreq < 2000) return 'viseme_I'     // i
  if (dominantFreq < 3000) return 'viseme_SS'    // s, sh
  if (dominantFreq < 4000) return 'viseme_FF'    // f, th

  return 'viseme_DD'
}

export function useLipSync() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const startLipSync = useCallback((audio: HTMLAudioElement) => {
    const { setViseme } = useChatStore.getState()

    try {
      // Crear contexto de audio si no existe
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current

      // Crear analyser
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      // Conectar el audio al analyser
      // Solo crear source si no existe para este elemento
      if (!sourceRef.current) {
        const source = audioContext.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioContext.destination)
        sourceRef.current = source
      }

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // Loop de análisis
      const analyze = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)

        // Calcular volumen promedio
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const volume = sum / bufferLength / 255

        // Encontrar frecuencia dominante
        let maxValue = 0
        let maxIndex = 0
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxValue) {
            maxValue = dataArray[i]
            maxIndex = i
          }
        }

        // Convertir índice a frecuencia
        const nyquist = audioContext.sampleRate / 2
        const dominantFreq = (maxIndex / bufferLength) * nyquist

        // Obtener visema correspondiente
        const viseme = frequencyToViseme(dominantFreq, volume)
        setViseme(viseme)

        // Continuar el loop
        animationFrameRef.current = requestAnimationFrame(analyze)
      }

      analyze()
    } catch (error) {
      console.error('Error starting lip sync:', error)
      // Fallback: simulación básica
      simulateLipSync()
    }
  }, [])

  const stopLipSync = useCallback(() => {
    const { setViseme } = useChatStore.getState()

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setViseme('viseme_sil')
  }, [])

  // Simulación de lip sync cuando no hay acceso al audio
  const simulateLipSync = useCallback(() => {
    const { setViseme, isTalking } = useChatStore.getState()
    const visemes = [
      'viseme_sil', 'viseme_aa', 'viseme_E', 'viseme_O',
      'viseme_U', 'viseme_I', 'viseme_sil'
    ]
    let index = 0

    const animate = () => {
      const state = useChatStore.getState()
      if (!state.isTalking) {
        setViseme('viseme_sil')
        return
      }

      // Seleccionar visema con algo de aleatoriedad
      const randomOffset = Math.floor(Math.random() * 3) - 1
      const newIndex = Math.max(0, Math.min(visemes.length - 1, index + randomOffset))
      setViseme(visemes[newIndex])

      index = (index + 1) % visemes.length
      animationFrameRef.current = requestAnimationFrame(() => {
        setTimeout(animate, 80 + Math.random() * 40) // 80-120ms
      })
    }

    animate()
  }, [])

  return { startLipSync, stopLipSync }
}
