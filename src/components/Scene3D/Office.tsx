'use client'

import { useRef } from 'react'
import * as THREE from 'three'

export function Office() {
  return (
    <group>
      {/* Suelo */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          color="#2a2a3a"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Pared de fondo */}
      <mesh position={[0, 1.5, -2]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial
          color="#1e2533"
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Escritorio */}
      <group position={[0, -0.4, 0.5]}>
        {/* Superficie del escritorio */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.05, 0.8]} />
          <meshStandardMaterial
            color="#4a3728"
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* Patas del escritorio */}
        {[
          [-0.9, -0.3, 0.3],
          [0.9, -0.3, 0.3],
          [-0.9, -0.3, -0.3],
          [0.9, -0.3, -0.3],
        ].map((pos, i) => (
          <mesh
            key={i}
            position={pos as [number, number, number]}
            castShadow
          >
            <boxGeometry args={[0.05, 0.6, 0.05]} />
            <meshStandardMaterial color="#3a2a20" />
          </mesh>
        ))}
      </group>

      {/* Silla (simplificada) */}
      <group position={[0, -0.5, 0]}>
        {/* Asiento */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.5]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* Respaldo */}
        <mesh position={[0, 0.1, -0.25]} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      </group>

      {/* Lámpara de escritorio */}
      <group position={[0.8, -0.35, 0.3]}>
        {/* Base */}
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.02, 16]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
        </mesh>

        {/* Brazo */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.4, 8]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.9} />
        </mesh>

        {/* Pantalla de la lámpara */}
        <mesh position={[0, 0.4, 0.05]} rotation={[0.5, 0, 0]}>
          <coneGeometry args={[0.1, 0.15, 16, 1, true]} />
          <meshStandardMaterial
            color="#4a4a4a"
            side={THREE.DoubleSide}
            metalness={0.7}
          />
        </mesh>

        {/* Luz de la lámpara */}
        <pointLight
          position={[0, 0.35, 0.1]}
          intensity={0.3}
          color="#ffeedd"
          distance={2}
        />
      </group>

      {/* Monitor (pantalla decorativa) */}
      <group position={[-0.5, 0, 0.2]}>
        {/* Pantalla */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.3, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Pantalla iluminada */}
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.46, 0.26]} />
          <meshBasicMaterial color="#2a3a4a" />
        </mesh>

        {/* Soporte */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.05, 0.1, 0.05]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>

        {/* Base del monitor */}
        <mesh position={[0, -0.26, 0]} castShadow>
          <boxGeometry args={[0.2, 0.02, 0.15]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      </group>

      {/* Planta decorativa */}
      <group position={[-1.2, -0.6, -0.5]}>
        {/* Maceta */}
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.08, 0.15, 8]} />
          <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
        </mesh>

        {/* Tierra */}
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.02, 8]} />
          <meshStandardMaterial color="#3a2a1a" />
        </mesh>

        {/* Hojas (simplificadas como esferas) */}
        {[
          [0, 0.2, 0],
          [0.05, 0.15, 0.05],
          [-0.05, 0.18, -0.03],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#2a5a2a" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Cuadro en la pared */}
      <group position={[0.8, 0.8, -1.95]}>
        {/* Marco */}
        <mesh>
          <boxGeometry args={[0.6, 0.4, 0.03]} />
          <meshStandardMaterial color="#3a3020" />
        </mesh>

        {/* Interior del cuadro */}
        <mesh position={[0, 0, 0.016]}>
          <planeGeometry args={[0.52, 0.32]} />
          <meshBasicMaterial color="#4a5a6a" />
        </mesh>
      </group>

      {/* Estantería */}
      <group position={[-1.5, 0.5, -1.9]}>
        {/* Repisa 1 */}
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.02, 0.2]} />
          <meshStandardMaterial color="#4a3a2a" />
        </mesh>

        {/* Repisa 2 */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.6, 0.02, 0.2]} />
          <meshStandardMaterial color="#4a3a2a" />
        </mesh>

        {/* Libros */}
        {[
          { pos: [-0.2, 0.08, 0], color: '#5a3a3a', size: [0.08, 0.14, 0.12] },
          { pos: [-0.08, 0.07, 0], color: '#3a3a5a', size: [0.06, 0.12, 0.12] },
          { pos: [0.02, 0.08, 0], color: '#3a5a3a', size: [0.07, 0.14, 0.12] },
          { pos: [0.12, 0.06, 0], color: '#5a5a3a', size: [0.05, 0.1, 0.12] },
        ].map((book, i) => (
          <mesh
            key={i}
            position={book.pos as [number, number, number]}
            castShadow
          >
            <boxGeometry args={book.size as [number, number, number]} />
            <meshStandardMaterial color={book.color} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
