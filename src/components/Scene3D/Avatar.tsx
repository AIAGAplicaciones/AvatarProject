'use client'

import { useRef, useEffect, useState, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useChatStore } from '@/store/chatStore'

// Mapeo de emociones a morph targets
const emotionMorphs: Record<string, Record<string, number>> = {
  neutral: {},
  happy: {
    mouthSmile: 0.7,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    browInnerUp: 0.2,
  },
  sad: {
    mouthFrownLeft: 0.5,
    mouthFrownRight: 0.5,
    browDownLeft: 0.4,
    browDownRight: 0.4,
    browInnerUp: 0.6,
  },
  surprised: {
    mouthOpen: 0.5,
    browInnerUp: 0.8,
    eyeWideLeft: 0.6,
    eyeWideRight: 0.6,
  },
  angry: {
    browDownLeft: 0.7,
    browDownRight: 0.7,
    mouthFrownLeft: 0.4,
    mouthFrownRight: 0.4,
    jawForward: 0.2,
  },
  thinking: {
    browInnerUp: 0.5,
    eyeLookUpLeft: 0.3,
    eyeLookUpRight: 0.3,
    mouthPucker: 0.2,
  },
}

// Lista de visemas de Oculus (Ready Player Me)
// Estos son morph targets directos en el modelo
const OCULUS_VISEMES = [
  'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH', 'viseme_DD',
  'viseme_kk', 'viseme_CH', 'viseme_SS', 'viseme_nn', 'viseme_RR',
  'viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U'
]

interface AvatarProps {
  position?: [number, number, number]
}

// Avatar placeholder cuando no hay modelo GLB
function PlaceholderAvatar({ position }: AvatarProps) {
  const group = useRef<THREE.Group>(null)
  const mouthRef = useRef<THREE.Mesh>(null)
  const { currentEmotion, isTalking } = useChatStore()

  // Estado para animaciones
  const idleState = useRef({ breathPhase: 0, headPhase: 0, talkPhase: 0 })

  useFrame((state, delta) => {
    if (!group.current) return

    idleState.current.breathPhase += delta * 0.5
    idleState.current.headPhase += delta * 0.3

    // Respiración sutil
    const breathOffset = Math.sin(idleState.current.breathPhase) * 0.01
    group.current.position.y = (position?.[1] || 0) + breathOffset

    // Movimiento sutil de cabeza
    const headOffset = Math.sin(idleState.current.headPhase) * 0.02
    group.current.rotation.y = headOffset

    // Animación de boca al hablar
    if (mouthRef.current && isTalking) {
      idleState.current.talkPhase += delta * 15
      const mouthOpen = Math.abs(Math.sin(idleState.current.talkPhase)) * 0.03
      mouthRef.current.scale.y = 0.5 + mouthOpen * 5
    } else if (mouthRef.current) {
      mouthRef.current.scale.y = 0.5
    }
  })

  // Color según emoción
  const faceColor = {
    neutral: '#ffd5b8',
    happy: '#ffe5cc',
    sad: '#e5c5a8',
    surprised: '#ffeedd',
    angry: '#ffccbb',
    thinking: '#ffd5c5',
  }[currentEmotion] || '#ffd5b8'

  return (
    <group ref={group} position={position}>
      {/* Cuerpo */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color="#3a4a5a" />
      </mesh>

      {/* Cabeza */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>

      {/* Ojos */}
      <mesh position={[-0.1, 1.05, 0.25]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.1, 1.05, 0.25]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Pupilas */}
      <mesh position={[-0.1, 1.05, 0.29]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>
      <mesh position={[0.1, 1.05, 0.29]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="#2a2a3a" />
      </mesh>

      {/* Boca */}
      <mesh ref={mouthRef} position={[0, 0.9, 0.27]}>
        <boxGeometry args={[0.1, 0.02, 0.02]} />
        <meshStandardMaterial color="#aa5555" />
      </mesh>

      {/* Texto indicador */}
      <group position={[0, 1.5, 0]}>
        {/* Este es un placeholder visual */}
      </group>
    </group>
  )
}

// Avatar con modelo GLB
function GLBAvatar({ position = [0, 0, 0] }: AvatarProps) {
  const group = useRef<THREE.Group>(null)
  const meshesRef = useRef<THREE.SkinnedMesh[]>([])
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  const { currentEmotion, isTalking, currentViseme } = useChatStore()

  // Estado para parpadeo
  const blinkState = useRef({ nextBlink: 0, isBlinking: false, blinkProgress: 0 })

  // Estado para movimiento idle
  const idleState = useRef({ breathPhase: 0, headPhase: 0, talkPhase: 0 })

  // Cargar el modelo GLB
  const { scene, animations } = useGLTF('/models/avatar.glb')

  // Configurar el modelo y animaciones
  useEffect(() => {
    meshesRef.current = []

    // Buscar TODOS los meshes con morph targets
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (child.morphTargetDictionary && child.morphTargetInfluences) {
          meshesRef.current.push(child)
        }
      }
    })

    // Configurar mixer de animaciones si hay
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene)
      const idleAnimation = animations[0]
      if (idleAnimation) {
        const action = mixerRef.current.clipAction(idleAnimation)
        action.play()
      }
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [scene, animations])

  // Animación frame a frame
  useFrame((state, delta) => {
    // Actualizar mixer de animaciones
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Aplicar morph targets a TODOS los meshes
    for (const mesh of meshesRef.current) {
      if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) continue

      const morphDict = mesh.morphTargetDictionary
      const morphInfluences = mesh.morphTargetInfluences

      // Reset all morph targets gradually (excepto visemas activos)
      for (let i = 0; i < morphInfluences.length; i++) {
        morphInfluences[i] = THREE.MathUtils.lerp(morphInfluences[i], 0, delta * 8)
      }

      // Aplicar emoción
      const emotionTargets = emotionMorphs[currentEmotion] || {}
      for (const [morphName, value] of Object.entries(emotionTargets)) {
        const index = morphDict[morphName]
        if (index !== undefined) {
          morphInfluences[index] = THREE.MathUtils.lerp(
            morphInfluences[index],
            value,
            delta * 3
          )
        }
      }

      // Aplicar visema DIRECTO si está hablando (Ready Player Me tiene los visemas como morph targets)
      if (isTalking && currentViseme) {
        const visemeIndex = morphDict[currentViseme]
        if (visemeIndex !== undefined) {
          // Aplicar el visema actual con intensidad alta
          morphInfluences[visemeIndex] = THREE.MathUtils.lerp(
            morphInfluences[visemeIndex],
            1.0,
            delta * 15
          )
        }
      }

      // Parpadeo automático
      const time = state.clock.elapsedTime
      const blink = blinkState.current

      if (time > blink.nextBlink && !blink.isBlinking) {
        blink.isBlinking = true
        blink.blinkProgress = 0
      }

      if (blink.isBlinking) {
        blink.blinkProgress += delta * 8
        const blinkValue = Math.sin(blink.blinkProgress * Math.PI)

        const blinkLeftIndex = morphDict['eyeBlinkLeft']
        const blinkRightIndex = morphDict['eyeBlinkRight']

        if (blinkLeftIndex !== undefined) {
          morphInfluences[blinkLeftIndex] = blinkValue
        }
        if (blinkRightIndex !== undefined) {
          morphInfluences[blinkRightIndex] = blinkValue
        }

        if (blink.blinkProgress >= 1) {
          blink.isBlinking = false
          blink.nextBlink = time + 2 + Math.random() * 4
        }
      }
    }

    // Movimiento idle sutil (respiración y cabeza)
    if (group.current) {
      idleState.current.breathPhase += delta * 0.5
      idleState.current.headPhase += delta * 0.3

      // Respiración sutil
      const breathOffset = Math.sin(idleState.current.breathPhase) * 0.005
      group.current.position.y = position[1] + breathOffset

      // Movimiento sutil de cabeza
      const headOffset = Math.sin(idleState.current.headPhase) * 0.02
      group.current.rotation.y = headOffset

      // Movimiento de habla adicional
      if (isTalking) {
        idleState.current.talkPhase += delta * 8
        const talkNod = Math.sin(idleState.current.talkPhase) * 0.01
        group.current.rotation.x = talkNod
      } else {
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, delta * 3)
      }
    }
  })

  return (
    <group ref={group} position={position} dispose={null}>
      <primitive object={scene} scale={1} />
    </group>
  )
}

// Componente principal que decide qué avatar mostrar
export function Avatar({ position = [0, 0, 0] }: AvatarProps) {
  const [hasGLBModel, setHasGLBModel] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar si existe el modelo GLB
    fetch('/models/avatar.glb', { method: 'HEAD' })
      .then((res) => {
        // Verificar que sea un archivo GLB válido (no un error JSON)
        const contentType = res.headers.get('content-type')
        const isValidGLB = res.ok && (contentType?.includes('model/gltf-binary') || contentType?.includes('application/octet-stream'))
        setHasGLBModel(isValidGLB === true)
      })
      .catch(() => setHasGLBModel(false))
  }, [])

  // Mientras carga, mostrar placeholder
  if (hasGLBModel === null) {
    return <PlaceholderAvatar position={position} />
  }

  // Si hay modelo GLB, intentar cargarlo
  if (hasGLBModel) {
    return (
      <Suspense fallback={<PlaceholderAvatar position={position} />}>
        <GLBAvatar position={position} />
      </Suspense>
    )
  }

  // Si no hay modelo, usar placeholder
  return <PlaceholderAvatar position={position} />
}
