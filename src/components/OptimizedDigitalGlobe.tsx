import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useOptimizedPerformance } from '@/hooks/useOptimizedPerformance'
import StaticGlobeFallback from './globe/StaticGlobeFallback'

// Heavy three.js / R3F scene is code-split and only fetched when we actually
// render the WebGL globe.
const DigitalGlobe = lazy(() => import('./DigitalGlobe'))

const LoadingGlobe = () => (
  <div className="w-full aspect-square bg-transparent rounded-lg flex items-center justify-center">
    <div className="text-tech-purple animate-pulse text-lg">Loading Globe...</div>
  </div>
)

const OptimizedDigitalGlobe = () => {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)

  const { capabilities, qualityFactor, getOptimalSettings: settings } =
    useOptimizedPerformance()

  // Mount once when near the viewport; keep tracking so we can pause frames
  // when the globe scrolls out of view.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true)
        setOnScreen(entry.isIntersecting)
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Pause rendering while the tab is hidden.
  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Route weak / no-WebGL / reduced-motion contexts to the static fallback so
  // three.js is never even fetched for them.
  const use3D =
    settings.enable3D &&
    settings.enableWebGL &&
    capabilities.supportsWebGL &&
    !settings.reducedMotion

  return (
    <div ref={sentinelRef}>
      {!mounted ? (
        <div className="w-full aspect-square bg-transparent rounded-lg" />
      ) : use3D ? (
        <Suspense fallback={<LoadingGlobe />}>
          <DigitalGlobe
            active={onScreen && tabVisible}
            qualityFactor={qualityFactor}
            effectQuality={settings.effectQuality}
            reducedMotion={false}
          />
        </Suspense>
      ) : (
        <StaticGlobeFallback />
      )}
    </div>
  )
}

export default OptimizedDigitalGlobe
