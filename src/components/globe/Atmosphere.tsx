import { useMemo } from 'react'
import * as THREE from 'three'
import { GLOBE_COLORS } from './globeConfig'

interface AtmosphereProps {
  radius: number
}

// A fresnel rim-glow rendered on the back faces of a slightly larger sphere.
// Additive + depthWrite off so it reads as a soft atmospheric halo behind the
// globe. Cheap (one mesh) but a big share of the "premium" feel.
const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
    float f = pow(clamp(rim, 0.0, 1.0), uPower);
    gl_FragColor = vec4(uColor, f * uIntensity);
  }
`

const Atmosphere = ({ radius }: AtmosphereProps) => {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(GLOBE_COLORS.purple) },
      uPower: { value: 3.0 },
      uIntensity: { value: 1.15 },
    }),
    [],
  )

  return (
    <mesh scale={radius * 1.16}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

export default Atmosphere
