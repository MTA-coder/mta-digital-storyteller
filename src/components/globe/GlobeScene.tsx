import { useEffect, useRef, type ElementRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import DottedEarth from './DottedEarth'
import Atmosphere from './Atmosphere'
import Graticule from './Graticule'
import Arcs from './Arcs'
import CountryMarkers from './CountryMarkers'
import { latLngToVec3 } from './globeMath'
import type { GlobeQualityConfig } from './globeConfig'
import type { CountryData } from './countryData'

interface GlobeSceneProps {
  config: GlobeQualityConfig
  selected: CountryData | null
  onHover: (country: CountryData | null) => void
  onSelect: (country: CountryData) => void
}

const WORLD_UP = new THREE.Vector3(0, 1, 0)
const RESUME_DELAY = 2000

const GlobeScene = ({ config, selected, onHover, onSelect }: GlobeSceneProps) => {
  const { camera } = useThree()
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null)
  const groupRef = useRef<THREE.Group>(null)
  // Idle spin is driven imperatively (refs, not state) so it never triggers
  // React re-renders and can't be starved by drei's control loop.
  const spinning = useRef(config.autoRotate)
  const focusQuat = useRef<THREE.Quaternion | null>(null)
  const idleTimer = useRef<number>()

  useEffect(() => {
    spinning.current = config.autoRotate
  }, [config.autoRotate])

  // On select, rotate the whole globe so the country faces the current camera.
  useEffect(() => {
    if (!selected) {
      focusQuat.current = null
      return
    }
    const nLocal = new THREE.Vector3(
      ...latLngToVec3(selected.lat, selected.lng, 1),
    ).normalize()
    const camDir = camera.position.clone().normalize()
    focusQuat.current = new THREE.Quaternion().setFromUnitVectors(nLocal, camDir)
    spinning.current = false
    window.clearTimeout(idleTimer.current)
  }, [selected, camera])

  const resumeAfterIdle = () => {
    if (!config.autoRotate) return
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => {
      spinning.current = true
    }, RESUME_DELAY)
  }

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    // Clamp delta so a paused/backgrounded tab doesn't jump on resume.
    const dt = Math.min(delta, 0.1)
    if (focusQuat.current) {
      g.quaternion.slerp(focusQuat.current, Math.min(1, dt * 4))
      if (g.quaternion.angleTo(focusQuat.current) < 0.01) {
        focusQuat.current = null
        resumeAfterIdle()
      }
    } else if (spinning.current) {
      g.rotateOnWorldAxis(WORLD_UP, config.rotateSpeed * dt)
    }
  })

  const handleStart = () => {
    focusQuat.current = null
    window.clearTimeout(idleTimer.current)
    spinning.current = false
  }

  useEffect(() => () => window.clearTimeout(idleTimer.current), [])

  const { globeRadius: r } = config

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        minDistance={r * 2.3}
        maxDistance={config.cameraDistance * 1.6}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        onStart={handleStart}
        onEnd={resumeAfterIdle}
      />

      <AdaptiveDpr pixelated />

      {config.showAtmosphere && <Atmosphere radius={r} />}

      {/* Everything that should spin together lives in this group. */}
      <group ref={groupRef}>
        <DottedEarth
          radius={r}
          dotCount={config.dotCount}
          dotSize={config.dotSize}
          animate={config.autoRotate}
        />
        {config.showGraticule && <Graticule radius={r} />}
        <Arcs radius={r} count={config.arcCount} animate={config.animateArcs} />
        <CountryMarkers
          radius={r}
          segments={config.markerSegments}
          animate={config.animateArcs}
          activeName={selected?.name ?? null}
          onHover={onHover}
          onSelect={onSelect}
        />
      </group>
    </>
  )
}

export default GlobeScene
