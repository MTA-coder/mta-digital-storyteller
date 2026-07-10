import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { landDots, landDotCount } from './landDots'
import { latLngToVec3, angularDistance } from './globeMath'
import { GLOBE_COLORS } from './globeConfig'
import { countries } from './countryData'

interface DottedEarthProps {
  radius: number
  dotCount: number
  dotSize: number
  animate: boolean
}

// Round, soft-edged, size-attenuated points. Kept as a ShaderMaterial (GPU
// only) so there's no runtime canvas/sprite work, and a subtle time-driven
// twinkle when animation is enabled.
const vertexShader = /* glsl */ `
  uniform float uSize;
  uniform float uScale;
  uniform float uTime;
  attribute vec3 aColor;
  attribute float aScale;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.84 + 0.16 * sin(uTime * 1.6 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * aScale * (uScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.18, d);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(vColor * vTwinkle, alpha);
  }
`

const DottedEarth = ({ radius, dotCount, dotSize, animate }: DottedEarthProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size, camera } = useThree()

  const geometry = useMemo(() => {
    const total = landDotCount
    const count = Math.min(dotCount, total)
    const step = total / count

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const phases = new Float32Array(count)

    const cPurple = new THREE.Color(GLOBE_COLORS.purple)
    const cBlue = new THREE.Color(GLOBE_COLORS.blue)
    const cHome = new THREE.Color(GLOBE_COLORS.lightPurple)
    const tmp = new THREE.Color()

    const home = countries[0] // Syria — the base the arcs radiate from

    for (let i = 0; i < count; i++) {
      const src = Math.round(i * step) % total
      const lat = landDots[src * 2]
      const lng = landDots[src * 2 + 1]
      const [x, y, z] = latLngToVec3(lat, lng, radius)
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Purple-dominant with cooler blue toward the equator, warmed near home.
      const t = Math.min(1, Math.max(0, (lat + 90) / 180))
      tmp.copy(cPurple).lerp(cBlue, t * 0.45)
      const dHome = angularDistance(lat, lng, home.lat, home.lng)
      if (dHome < 0.4) tmp.lerp(cHome, (1 - dHome / 0.4) * 0.8)
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b

      scales[i] = 0.7 + Math.random() * 0.6
      phases[i] = Math.random() * Math.PI * 2
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return geo
  }, [radius, dotCount])

  // Size attenuation factor: pixels-per-world-unit at unit depth.
  const uScale = useMemo(() => {
    const persp = camera as THREE.PerspectiveCamera
    const fov = (persp.fov ?? 45) * (Math.PI / 180)
    return size.height / (2 * Math.tan(fov / 2))
  }, [size.height, camera])

  const uniforms = useMemo(
    () => ({
      uSize: { value: dotSize },
      uScale: { value: uScale },
      uTime: { value: 0 },
    }),
    // uScale/dotSize pushed via effect below to avoid recreating the material
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useFrame((state) => {
    const m = materialRef.current
    if (!m) return
    m.uniforms.uSize.value = dotSize
    m.uniforms.uScale.value = uScale
    if (animate) m.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group>
      {/* Depth-only occluder so far-side dots/markers are correctly hidden. */}
      <mesh>
        <sphereGeometry args={[radius * 0.985, 48, 48]} />
        <meshBasicMaterial colorWrite={false} />
      </mesh>

      <points geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
        />
      </points>
    </group>
  )
}

export default DottedEarth
