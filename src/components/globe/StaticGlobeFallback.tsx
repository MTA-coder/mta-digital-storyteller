import { useMemo } from 'react'
import { countries } from './countryData'
import { GLOBE_COLORS } from './globeConfig'

/**
 * Zero-cost globe for devices/preferences that can't (or shouldn't) run WebGL:
 * low-end hardware, no WebGL, or prefers-reduced-motion. Pure SVG, no
 * animation, no three.js — and deliberately imports no heavy data so it stays
 * out of the critical bundle.
 */
const R = 92
const CX = 100
const CY = 100
// View centred over the home region (Middle East / Europe / Africa).
const LAT0 = 18
const LNG0 = 22
const DEG = Math.PI / 180

const project = (lat: number, lng: number) => {
  const phi = lat * DEG
  const lambda = (lng - LNG0) * DEG
  const phi0 = LAT0 * DEG
  const cosc =
    Math.sin(phi0) * Math.sin(phi) +
    Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda)
  if (cosc < 0.02) return null // back hemisphere
  const x = Math.cos(phi) * Math.sin(lambda)
  const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)
  return { x: CX + x * R, y: CY - y * R }
}

const StaticGlobeFallback = () => {
  const markers = useMemo(
    () =>
      countries
        .map((c) => ({ c, p: project(c.lat, c.lng) }))
        .filter((m): m is { c: (typeof countries)[number]; p: { x: number; y: number } } => m.p !== null),
    [],
  )

  return (
    <div className="w-full aspect-square flex items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full max-w-full"
        role="img"
        aria-label="Globe highlighting countries where Mohammed has delivered projects."
      >
        <defs>
          <radialGradient id="globe-body" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={GLOBE_COLORS.indigo} stopOpacity="0.45" />
            <stop offset="55%" stopColor={GLOBE_COLORS.purple} stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0b0b16" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={GLOBE_COLORS.purple} stopOpacity="0" />
            <stop offset="88%" stopColor={GLOBE_COLORS.purple} stopOpacity="0.35" />
            <stop offset="100%" stopColor={GLOBE_COLORS.purple} stopOpacity="0" />
          </radialGradient>
          <pattern id="globe-dots" width="6.5" height="6.5" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="0.9" fill={GLOBE_COLORS.purple} opacity="0.55" />
          </pattern>
          <clipPath id="globe-clip">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
        </defs>

        {/* Atmospheric halo */}
        <circle cx={CX} cy={CY} r={R + 6} fill="url(#globe-glow)" />

        {/* Sphere body + dotted texture */}
        <circle cx={CX} cy={CY} r={R} fill="url(#globe-body)" />
        <circle cx={CX} cy={CY} r={R} fill="url(#globe-dots)" clipPath="url(#globe-clip)" />

        {/* Graticule — parallels + meridians */}
        <g
          stroke={GLOBE_COLORS.purple}
          strokeOpacity="0.18"
          fill="none"
          strokeWidth="0.6"
          clipPath="url(#globe-clip)"
        >
          {[0.42, 0.72, 0.92].map((k) => (
            <ellipse key={`p${k}`} cx={CX} cy={CY} rx={R} ry={R * k} />
          ))}
          {[0.3, 0.62, 0.9].map((k) => (
            <ellipse key={`m${k}`} cx={CX} cy={CY} rx={R * k} ry={R} />
          ))}
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} />
        </g>

        {/* Rim */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={GLOBE_COLORS.purple} strokeOpacity="0.4" strokeWidth="0.8" />

        {/* Country markers */}
        {markers.map(({ c, p }) => (
          <g key={c.name}>
            <circle cx={p.x} cy={p.y} r="2.6" fill={GLOBE_COLORS.blue} opacity="0.25" />
            <circle cx={p.x} cy={p.y} r="1.3" fill={GLOBE_COLORS.blue} />
          </g>
        ))}
      </svg>
    </div>
  )
}

export default StaticGlobeFallback
