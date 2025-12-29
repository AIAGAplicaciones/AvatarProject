'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls, Environment } from '@react-three/drei'
import { Avatar } from './Avatar'

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  )
}

export default function Scene() {
  return (
    <div className="relative w-full h-full">
      {/* Imagen de fondo de oficina */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/office-bg.jpg)',
          filter: 'brightness(0.8)'
        }}
      />

      {/* Canvas 3D transparente sobre la imagen */}
      <Canvas
        camera={{
          position: [0, 0.35, 0.9],
          fov: 30,
          near: 0.1,
          far: 100,
        }}
        shadows
        className="absolute inset-0"
        style={{ background: 'transparent' }}
      >
        {/* Iluminación */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />

        {/* Luz de relleno frontal para el avatar */}
        <pointLight position={[0, 1, 2]} intensity={0.6} color="#ffffff" />

        <Suspense fallback={<LoadingFallback />}>
          {/* Entorno HDR para reflejos realistas */}
          <Environment preset="apartment" />

          {/* Avatar 3D - posicionado detrás del escritorio */}
          <Avatar position={[0, -1.55, 0]} />

        </Suspense>

        {/* Controles de cámara - limitados para mantener la vista de escritorio */}
        <OrbitControls
          target={[0, 0.25, 0]}
          minDistance={0.6}
          maxDistance={1.5}
          minPolarAngle={Math.PI / 2.3}
          maxPolarAngle={Math.PI / 2}
          enablePan={false}
          enableZoom={false}
        />
      </Canvas>
    </div>
  )
}
