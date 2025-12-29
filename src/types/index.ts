// Tipos para el sistema de chat
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  isSpeaking: boolean
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setSpeaking: (speaking: boolean) => void
  clearMessages: () => void
}

// Tipos para el avatar
export interface AvatarState {
  currentEmotion: Emotion
  isTalking: boolean
  currentViseme: string
  setEmotion: (emotion: Emotion) => void
  setTalking: (talking: boolean) => void
  setViseme: (viseme: string) => void
}

export type Emotion = 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry' | 'thinking'

// Visemas para lip-sync (basados en Oculus Lipsync)
export type Viseme =
  | 'viseme_sil'    // Silencio
  | 'viseme_PP'     // p, b, m
  | 'viseme_FF'     // f, v
  | 'viseme_TH'     // th
  | 'viseme_DD'     // t, d
  | 'viseme_kk'     // k, g
  | 'viseme_CH'     // ch, j, sh
  | 'viseme_SS'     // s, z
  | 'viseme_nn'     // n, l
  | 'viseme_RR'     // r
  | 'viseme_aa'     // a
  | 'viseme_E'      // e
  | 'viseme_I'      // i
  | 'viseme_O'      // o
  | 'viseme_U'      // u

// Configuración de personalidad del avatar
export interface AvatarPersonality {
  name: string
  role: string
  systemPrompt: string
  voiceId: string
  language: string
}

// Tipos para Text-to-Speech
export interface TTSRequest {
  text: string
  voiceId?: string
}

export interface TTSResponse {
  audioUrl: string
  duration: number
}
