import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { countries } from './countryData'
import { latLngToVec3 } from './globeMath'
import { GLOBE_COLORS } from './globeConfig'

interface ArcsProps {
  radius: number
  count: number
  animate: boolean
}

// A faintly-drawn arc with a bright pulse that travels from the home base
// outward. `uHead` sweeps 0 -> 1.4 (the >1 tail is a rest gap between pulses);
// the fragment shader lights vertices just behind the head via uv.x.
const vertexShader = /* glsl */ `
  varying float vT;
  void main() {
    vT = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uHead;
  uniform float uTrail;
  uniform vec3 uBase;
  uniform vec3 uPulse;
  varying float vT;
  void main() {
    float d = uHead - vT;
    float pulse = d >= 0.0 ? exp(-d / uTrail) : 0.0;
    vec3 col = mix(uBase, uPulse, pulse);
    float a = 0.22 + pulse * 0.85;
    gl_FragColor = vec4(col, a);
  }
`

// Spherical linear interpolation between two unit vectors.
const slerp = (a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) => {
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1)
  const omega = Math.acos(dot)
  if (omega < 1e-4) return out.copy(a)
  const so = Math.sin(omega)
  const s1 = Math.sin((1 - t) * omega) / so
  const s2 = Math.sin(t * omega) / so
  return out
    .copy(a)
    .multiplyScalar(s1)
    .addScaledVector(b, s2)
}

interface ArcDatum {
  geometry: THREE.TubeGeometry
  uniforms: {
    uHead: { value: number }
    uTrail: { value: number }
    uBase: { value: THREE.Color }
    uPulse: { value: THREE.Color }
  }
  speed: number
  phase: number
}

const Arcs = ({ radius, count, animate }: ArcsProps) => {
  const arcs = useMemo<ArcDatum[]>(() => {
    const home = countries[0]
    const start = new THREE.Vector3(...latLngToVec3(home.lat, home.lng, 1))
    const targets = countries.slice(1, 1 + count)

    return targets.map((c, i) => {
      const end = new THREE.Vector3(...latLngToVec3(c.lat, c.lng, 1))
      const angle = start.angleTo(end)
      const lift = radius * (0.14 + angle * 0.14)

      const N = 64
      const pts: THREE.Vector3[] = []
      const tmp = new THREE.Vector3()
      for (let s = 0; s <= N; s++) {
        const t = s / N
        slerp(start, end, t, tmp)
        const elevation = radius + lift * Math.sin(Math.PI * t)
        pts.push(tmp.clone().multiplyScalar(elevation))
      }

      const curve = new THREE.CatmullRomCurve3(pts)
      const geometry = new THREE.TubeGeometry(curve, N, radius * 0.006, 6, false)

      return {
        geometry,
        uniforms: {
          uHead: { value: 2 },
          uTrail: { value: 0.16 },
          uBase: { value: new THREE.Color(GLOBE_COLORS.purple) },
          uPulse: { value: new THREE.Color(GLOBE_COLORS.cyan) },
        },
        speed: 0.16 + Math.random() * 0.12,
        phase: (i / Math.max(1, targets.length)) * 1.4 + Math.random() * 0.2,
      }
    })
  }, [radius, count])

  const arcsRef = useRef(arcs)
  arcsRef.current = arcs

  useFrame((state) => {
    if (!animate) return
    const t = state.clock.elapsedTime
    for (const arc of arcsRef.current) {
      arc.uniforms.uHead.value = (t * arc.speed + arc.phase) % 1.4
    }
  })

  return (
    <group>
      {arcs.map((arc, i) => (
        <mesh key={i} geometry={arc.geometry}>
          <shaderMaterial
            uniforms={arc.uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

export default Arcs
