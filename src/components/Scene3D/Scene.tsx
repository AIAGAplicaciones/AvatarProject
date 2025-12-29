'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
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
          position: [0, 1.5, 2.5],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        shadows
        className="absolute inset-0"
        style={{ background: 'transparent' }}
      >
        {/* Iluminación */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />

        {/* Luz de relleno frontal para el avatar */}
        <pointLight position={[0, 2, 3]} intensity={0.6} color="#ffffff" />

        <Suspense fallback={<LoadingFallback />}>
          {/* Entorno HDR para reflejos realistas */}
          <Environment preset="apartment" />

          {/* Avatar 3D */}
          <Avatar position={[0, -1, 0]} />

          {/* Sombras de contacto */}
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />
        </Suspense>

        {/* Controles de cámara */}
        <OrbitControls
          target={[0, 0.5, 0]}
          minDistance={1.5}
          maxDistance={5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          enablePan={false}
        />
      </Canvas>
    </div>
  )
}
