export interface GlobeConfig {
    isMobile: boolean
    isTablet: boolean
    scale: number
    globeRadius: number
    latStep: number
    lngStep: number
    latSegments: number
    latPointInterval: number
    lngLatStep: number
    lngPointInterval: number
    mainLineOpacity: number
    subLineOpacity: number
    mainGlowOpacity: number
    subGlowOpacity: number
    connectionPointSkip: number
    pointSize: number
    markerSize: number
    markerGlowSize: number
    particleCount: number
    particleSize: number
    networkConnections: number
    cameraZ: number
    markerSegments: number
}

/** Returns responsive scaling factors based on container width */
export const getResponsiveConfig = (containerWidth: number): GlobeConfig => {
    const isMobile = containerWidth < 480
    const isTablet = containerWidth >= 480 && containerWidth < 768
    const scale = containerWidth / 500 // 500 is the desktop reference size

    return {
        isMobile,
        isTablet,
        scale: Math.min(scale, 1),
        globeRadius: isMobile ? 2.4 : isTablet ? 2.6 : 2.8,
        latStep: isMobile ? 20 : 10,
        lngStep: isMobile ? 20 : 10,
        latSegments: isMobile ? 32 : 64,
        latPointInterval: isMobile ? 16 : 8,
        lngLatStep: isMobile ? 12 : 6,
        lngPointInterval: isMobile ? 30 : 15,
        mainLineOpacity: isMobile ? 0.5 : 0.8,
        subLineOpacity: isMobile ? 0.3 : 0.5,
        mainGlowOpacity: isMobile ? 0.2 : 0.4,
        subGlowOpacity: isMobile ? 0.1 : 0.2,
        connectionPointSkip: isMobile ? 5 : 3,
        pointSize: isMobile ? 0.015 : 0.02,
        markerSize: isMobile ? 0.06 : 0.08,
        markerGlowSize: isMobile ? 0.09 : 0.12,
        particleCount: isMobile ? 8 : 20,
        particleSize: isMobile ? 0.01 : 0.015,
        networkConnections: isMobile ? 8 : 15,
        cameraZ: isMobile ? 6.5 : 6,
        markerSegments: isMobile ? 8 : 16,
    }
}

/* ------------------------------------------------------------------ *
 * Quality configuration for the React Three Fiber globe.
 *
 * Derived from the app's `useOptimizedPerformance` signals (qualityFactor
 * 0.4–1.0 and an effect-quality tier) plus container width, so the scene
 * scales dot/arc density, DPR and optional effects to the device. This is
 * separate from `getResponsiveConfig` (kept for the legacy wireframe/tests).
 * ------------------------------------------------------------------ */

/** Brand palette shared across every globe layer (matches tailwind `tech.*`). */
export const GLOBE_COLORS = {
    purple: '#9b87f5', // tech-purple — primary
    blue: '#1eaedb', // tech-blue — markers / accents
    indigo: '#6366f1', // secondary — connections
    lightPurple: '#d6bcfa', // tech-light-purple — highlights
    cyan: '#22d3ee', // arc packet head
} as const

export type EffectQuality = 'low' | 'medium' | 'high'

export interface GlobeQualityConfig {
    /** Device-pixel-ratio range handed to the R3F <Canvas>. */
    dpr: [number, number]
    /** How many land dots to render (single THREE.Points draw call). */
    dotCount: number
    /** Radius of each land dot. */
    dotSize: number
    /** Sphere radius. */
    globeRadius: number
    /** Camera distance from origin. */
    cameraDistance: number
    /** Max number of connection arcs to draw (home base → other countries). */
    arcCount: number
    /** Sphere segment count for country markers. */
    markerSegments: number
    /** Faint lat/lng wireframe — a nod to the original globe's identity. */
    showGraticule: boolean
    /** Fresnel atmosphere halo. */
    showAtmosphere: boolean
    /** Idle auto-rotation. */
    autoRotate: boolean
    /** Idle spin speed in radians/second. */
    rotateSpeed: number
    /** Animate the arc draw-in + travelling packet (vs. drawn-static). */
    animateArcs: boolean
}

/**
 * Build the globe quality config for the current device.
 *
 * @param containerWidth rendered globe width in px
 * @param qualityFactor  0.4–1.0 from useOptimizedPerformance
 * @param effectQuality  'low' | 'medium' | 'high'
 * @param reducedMotion  prefers-reduced-motion / low-power flag
 */
export const getQualityConfig = (
    containerWidth: number,
    qualityFactor: number,
    effectQuality: EffectQuality,
    reducedMotion: boolean,
): GlobeQualityConfig => {
    const isMobile = containerWidth < 480
    const isTablet = containerWidth >= 480 && containerWidth < 768

    // Upper bound on dots by screen tier, then scaled by the runtime quality
    // factor. Clamped so even weak devices still show a legible silhouette.
    // Desktop cap stays below the generated land-dot count (see landDots.ts).
    const maxDots = isMobile ? 3500 : isTablet ? 5500 : 7500
    const dotCount = Math.max(1500, Math.round(maxDots * qualityFactor))

    const dprCap = effectQuality === 'high' ? 2 : effectQuality === 'medium' ? 1.5 : 1

    return {
        dpr: [1, dprCap],
        dotCount,
        dotSize: isMobile ? 0.024 : 0.03,
        globeRadius: isMobile ? 2.4 : isTablet ? 2.6 : 2.8,
        // Tuned for a 45° FOV camera so the globe fills the frame nicely.
        cameraDistance: isMobile ? 9.5 : 9,
        arcCount: effectQuality === 'high' ? 10 : effectQuality === 'medium' ? 7 : 4,
        markerSegments: effectQuality === 'low' ? 12 : effectQuality === 'medium' ? 16 : 24,
        showGraticule: effectQuality !== 'low',
        showAtmosphere: true,
        autoRotate: !reducedMotion,
        rotateSpeed: 0.25, // rad/s — a visible-but-elegant ~25s per revolution
        animateArcs: !reducedMotion,
    }
}
