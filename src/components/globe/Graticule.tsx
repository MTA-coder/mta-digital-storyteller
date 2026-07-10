import { useMemo } from 'react'
import * as THREE from 'three'
import { latLngToVec3 } from './globeMath'
import { GLOBE_COLORS } from './globeConfig'

interface GraticuleProps {
  radius: number
}

// A faint lat/lng wireframe — a quiet nod to the original wireframe globe's
// identity — built as a single LineSegments (one draw call).
const Graticule = ({ radius }: GraticuleProps) => {
  const geometry = useMemo(() => {
    const r = radius * 1.001
    const pts: number[] = []
    const seg = 96

    const pushLoop = (coords: [number, number][]) => {
      for (let i = 0; i < coords.length; i++) {
        const a = coords[i]
        const b = coords[(i + 1) % coords.length]
        pts.push(...latLngToVec3(a[0], a[1], r), ...latLngToVec3(b[0], b[1], r))
      }
    }

    // Latitude circles
    for (let lat = -60; lat <= 60; lat += 30) {
      const ring: [number, number][] = []
      for (let i = 0; i < seg; i++) ring.push([lat, (i / seg) * 360 - 180])
      pushLoop(ring)
    }
    // Longitude half-circles (pole to pole)
    for (let lng = -180; lng < 180; lng += 30) {
      for (let i = 0; i < seg; i++) {
        const latA = -90 + (i / seg) * 180
        const latB = -90 + ((i + 1) / seg) * 180
        pts.push(...latLngToVec3(latA, lng, r), ...latLngToVec3(latB, lng, r))
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return geo
  }, [radius])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={GLOBE_COLORS.purple}
        transparent
        opacity={0.12}
        depthWrite={false}
      />
    </lineSegments>
  )
}

export default Graticule
