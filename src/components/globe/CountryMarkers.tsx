import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { countries, type CountryData } from './countryData'
import { latLngToVec3 } from './globeMath'
import { GLOBE_COLORS } from './globeConfig'

interface CountryMarkersProps {
  radius: number
  segments: number
  animate: boolean
  activeName: string | null
  onHover: (country: CountryData | null) => void
  onSelect: (country: CountryData) => void
}

const UP_Z = new THREE.Vector3(0, 0, 1)

interface MarkerProps {
  country: CountryData
  radius: number
  segments: number
  size: number
  animate: boolean
  active: boolean
  phase: number
  onHover: (country: CountryData | null) => void
  onSelect: (country: CountryData) => void
}

const Marker = ({
  country,
  radius,
  segments,
  size,
  animate,
  active,
  phase,
  onHover,
  onSelect,
}: MarkerProps) => {
  const dotRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  // Position just off the surface; orient so the ripple ring lies tangent.
  const position = useMemo(
    () => new THREE.Vector3(...latLngToVec3(country.lat, country.lng, radius * 1.006)),
    [country, radius],
  )
  const quaternion = useMemo(() => {
    const normal = position.clone().normalize()
    return new THREE.Quaternion().setFromUnitVectors(UP_Z, normal)
  }, [position])

  const scaleTarget = useRef(new THREE.Vector3(1, 1, 1))

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (dotRef.current) {
      const s = active ? 1.8 : 1
      scaleTarget.current.set(s, s, s)
      dotRef.current.scale.lerp(scaleTarget.current, 0.15)
    }
    if (ringRef.current) {
      const cycle = animate ? (t * 0.7 + phase) % 1 : 0.45
      const s = 1 + cycle * 2.4
      ringRef.current.scale.set(s, s, 1)
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (animate ? (1 - cycle) * 0.55 : 0.2) * (active ? 1.6 : 1)
    }
  })

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onHover(country)
    document.body.style.cursor = 'pointer'
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onHover(null)
    document.body.style.cursor = ''
  }
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(country)
  }

  return (
    <group position={position} quaternion={quaternion}>
      {/* Expanding ripple ring (tangent to the surface) */}
      <mesh ref={ringRef}>
        <ringGeometry args={[size * 1.5, size * 2.1, 32]} />
        <meshBasicMaterial
          color={GLOBE_COLORS.blue}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Soft glow */}
      <mesh scale={2}>
        <sphereGeometry args={[size, segments, segments]} />
        <meshBasicMaterial
          color={GLOBE_COLORS.indigo}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>

      {/* Interactive marker */}
      <mesh
        ref={dotRef}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[size, segments, segments]} />
        <meshBasicMaterial color={active ? GLOBE_COLORS.lightPurple : GLOBE_COLORS.blue} />
      </mesh>
    </group>
  )
}

const CountryMarkers = ({
  radius,
  segments,
  animate,
  activeName,
  onHover,
  onSelect,
}: CountryMarkersProps) => {
  const size = radius * 0.026
  // Stable per-marker phase so ripples don't pulse in lockstep.
  const phases = useMemo(() => countries.map(() => Math.random() * Math.PI * 2), [])

  return (
    <group>
      {countries.map((country, i) => (
        <Marker
          key={country.name}
          country={country}
          radius={radius}
          segments={segments}
          size={size}
          animate={animate}
          active={activeName === country.name}
          phase={phases[i]}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

export default CountryMarkers
