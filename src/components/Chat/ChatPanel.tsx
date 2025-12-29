'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useChat } from '@/hooks/useChat'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { MessageList } from './MessageList'

export function ChatPanel() {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { isLoading, isSpeaking } = useChatStore()
  const { sendMessage } = useChat()
  const { isListening, startListening, stopListening, transcript, isSupported } = useSpeechRecognition()

  // Actualizar input cuando hay transcripción de voz
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    await sendMessage(message)
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white">Chat con Avatar</h2>
        <p className="text-sm text-slate-400">
          {isSpeaking ? '🔊 Hablando...' : isLoading ? '💭 Pensando...' : '💬 Escribe o habla'}
        </p>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Escuchando...' : 'Escribe tu mensaje...'}
            disabled={isLoading || isSpeaking}
            className={`flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50
              ${isListening ? 'ring-2 ring-red-500' : ''}`}
          />

          {/* Botón de micrófono */}
          {isSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading || isSpeaking}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50
                ${isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-slate-600 hover:bg-slate-500 text-white'
                }`}
              title={isListening ? 'Detener grabación' : 'Hablar'}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>
          )}

          {/* Botón de enviar */}
          <button
            type="submit"
            disabled={isLoading || isSpeaking || !input.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : '➤'}
          </button>
        </div>

        {/* Indicador de voz no soportada */}
        {!isSupported && (
          <p className="text-xs text-slate-500 mt-2">
            Tu navegador no soporta reconocimiento de voz
          </p>
        )}
      </form>
    </div>
  )
}
