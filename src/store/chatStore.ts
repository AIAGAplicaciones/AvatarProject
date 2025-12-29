import { create } from 'zustand'
import { Message, Emotion } from '@/types'

interface ChatStore {
  // Estado del chat
  messages: Message[]
  isLoading: boolean
  isSpeaking: boolean

  // Estado del avatar
  currentEmotion: Emotion
  isTalking: boolean
  currentViseme: string

  // Acciones del chat
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setSpeaking: (speaking: boolean) => void
  clearMessages: () => void

  // Acciones del avatar
  setEmotion: (emotion: Emotion) => void
  setTalking: (talking: boolean) => void
  setViseme: (viseme: string) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  // Estado inicial del chat
  messages: [],
  isLoading: false,
  isSpeaking: false,

  // Estado inicial del avatar
  currentEmotion: 'neutral',
  isTalking: false,
  currentViseme: 'viseme_sil',

  // Acciones del chat
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setSpeaking: (speaking) => set({ isSpeaking: speaking }),

  clearMessages: () => set({ messages: [] }),

  // Acciones del avatar
  setEmotion: (emotion) => set({ currentEmotion: emotion }),

  setTalking: (talking) => set({ isTalking: talking }),

  setViseme: (viseme) => set({ currentViseme: viseme }),
}))
