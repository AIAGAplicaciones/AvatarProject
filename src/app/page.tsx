'use client'

import dynamic from 'next/dynamic'
import { ChatPanel } from '@/components/Chat/ChatPanel'

// Cargamos la escena 3D de forma dinámica para evitar errores de SSR
const Scene3D = dynamic(() => import('@/components/Scene3D/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-white text-xl">Cargando escena 3D...</div>
    </div>
  ),
})

export default function Home() {
  return (
    <main className="flex h-screen w-screen">
      {/* Escena 3D - Ocupa el espacio principal */}
      <div className="flex-1 relative">
        <Scene3D />
      </div>

      {/* Panel de Chat - Lateral derecho */}
      <div className="w-96 h-full border-l border-slate-700 bg-slate-800/50 backdrop-blur">
        <ChatPanel />
      </div>
    </main>
  )
}
