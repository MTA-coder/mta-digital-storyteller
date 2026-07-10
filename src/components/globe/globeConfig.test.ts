import { describe, it, expect } from 'vitest'
import { getResponsiveConfig, getQualityConfig } from './globeConfig'
import { landDotCount } from './landDots'

describe('getResponsiveConfig', () => {
    it('returns mobile config for narrow containers', () => {
        const config = getResponsiveConfig(320)
        expect(config.isMobile).toBe(true)
        expect(config.isTablet).toBe(false)
        expect(config.globeRadius).toBe(2.4)
        expect(config.latStep).toBe(20)
        expect(config.particleCount).toBe(8)
        expect(config.cameraZ).toBe(6.5)
    })

    it('returns tablet config for medium containers', () => {
        const config = getResponsiveConfig(600)
        expect(config.isMobile).toBe(false)
        expect(config.isTablet).toBe(true)
        expect(config.globeRadius).toBe(2.6)
    })

    it('returns desktop config for wide containers', () => {
        const config = getResponsiveConfig(1024)
        expect(config.isMobile).toBe(false)
        expect(config.isTablet).toBe(false)
        expect(config.globeRadius).toBe(2.8)
        expect(config.latStep).toBe(10)
        expect(config.particleCount).toBe(20)
        expect(config.cameraZ).toBe(6)
    })

    it('clamps scale to max 1.0', () => {
        const config = getResponsiveConfig(1200)
        expect(config.scale).toBeLessThanOrEqual(1)
    })
})

describe('getQualityConfig', () => {
    it('scales dot count with quality factor and never exceeds available dots', () => {
        const high = getQualityConfig(1024, 1, 'high', false)
        const low = getQualityConfig(1024, 0.4, 'low', false)
        expect(high.dotCount).toBeGreaterThan(low.dotCount)
        expect(high.dotCount).toBeLessThanOrEqual(landDotCount)
        expect(low.dotCount).toBeGreaterThanOrEqual(1500)
    })

    it('caps DPR by effect quality tier', () => {
        expect(getQualityConfig(1024, 1, 'high', false).dpr[1]).toBe(2)
        expect(getQualityConfig(1024, 0.8, 'medium', false).dpr[1]).toBe(1.5)
        expect(getQualityConfig(1024, 0.5, 'low', false).dpr[1]).toBe(1)
    })

    it('disables autonomous motion when reduced motion is requested', () => {
        const reduced = getQualityConfig(1024, 1, 'high', true)
        expect(reduced.autoRotate).toBe(false)
        expect(reduced.animateArcs).toBe(false)
    })

    it('hides the graticule on the low tier only', () => {
        expect(getQualityConfig(1024, 1, 'high', false).showGraticule).toBe(true)
        expect(getQualityConfig(1024, 0.5, 'low', false).showGraticule).toBe(false)
    })

    it('gives mobile widths a smaller dot budget than desktop', () => {
        const mobile = getQualityConfig(360, 1, 'high', false)
        const desktop = getQualityConfig(1024, 1, 'high', false)
        expect(mobile.dotCount).toBeLessThan(desktop.dotCount)
    })
})
