import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import SyriaFlag from './SyriaFlag'
import { countries, type CountryData } from './globe/countryData'
import { getQualityConfig, type EffectQuality } from './globe/globeConfig'
import GlobeScene from './globe/GlobeScene'

interface DigitalGlobeProps {
  /** Drives frameloop — false pauses rendering (offscreen / tab hidden). */
  active?: boolean
  /** 0.4–1.0 from useOptimizedPerformance. */
  qualityFactor?: number
  effectQuality?: EffectQuality
  reducedMotion?: boolean
}

const DigitalGlobe = ({
  active = true,
  qualityFactor = 1,
  effectQuality = 'high',
  reducedMotion = false,
}: DigitalGlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)
  const [hovered, setHovered] = useState<CountryData | null>(null)
  const [selected, setSelected] = useState<CountryData | null>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  // Track the rendered width so dot/arc density adapts to the actual size.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth || 400)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Quantize the (frequently-updating) quality factor so the dot geometry only
  // rebuilds at meaningful thresholds, not on every fps sample.
  const qf = useMemo(() => Math.round(qualityFactor * 4) / 4, [qualityFactor])
  const config = useMemo(
    () => getQualityConfig(width, qf, effectQuality, reducedMotion),
    [width, qf, effectQuality, reducedMotion],
  )

  const handleHover = useCallback((country: CountryData | null) => {
    setHovered(country)
  }, [])

  const handleSelect = useCallback((country: CountryData) => {
    setSelected((prev) => (prev?.name === country.name ? null : country))
  }, [])

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <div
        className="relative w-full aspect-square"
        onPointerMove={(e) => setPointer({ x: e.clientX, y: e.clientY })}
        role="img"
        aria-label="Interactive 3D globe highlighting countries where Mohammed has delivered projects. Drag to rotate, scroll to zoom, or use the country buttons below."
      >
        <Canvas
          frameloop={active ? 'always' : 'never'}
          dpr={config.dpr}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{
            position: [0, 1.6, config.cameraDistance],
            fov: 45,
            near: 0.1,
            far: 100,
          }}
        >
          <GlobeScene
            config={config}
            selected={selected}
            onHover={handleHover}
            onSelect={handleSelect}
          />
        </Canvas>
      </div>

      {/* Hover tooltip (mouse) */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: pointer.x + 15,
            top: pointer.y - 10,
            transform: 'translate(0, -100%)',
          }}
        >
          <div className="bg-secondary/95 backdrop-blur-sm border border-tech-purple/30 rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-2xl"
                style={{ fontSize: '1.5rem', lineHeight: '1' }}
              >
                {hovered.flag === 'SY' ? <SyriaFlag size={28} /> : hovered.flag}
              </span>
              <span className="font-semibold text-foreground">{hovered.name}</span>
            </div>
            {hovered.capital && (
              <div className="text-sm text-muted-foreground">
                Capital: {hovered.capital}
              </div>
            )}
            <div className="w-3 h-3 bg-secondary/95 border-r border-b border-tech-purple/30 absolute -bottom-1.5 left-4 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Accessible, keyboard-navigable country list (screen-reader friendly) */}
      <nav aria-label="Focus a country on the globe" className="sr-only">
        <ul>
          {countries.map((country) => (
            <li key={country.name}>
              <button type="button" onClick={() => handleSelect(country)}>
                Focus {country.name}
                {country.capital ? `, capital ${country.capital}` : ''}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Announce the focused country for assistive tech */}
      <div className="sr-only" aria-live="polite">
        {selected
          ? `Focused ${selected.name}${
              selected.capital ? `, ${selected.capital}` : ''
            }`
          : ''}
      </div>
    </div>
  )
}

export default DigitalGlobe
