import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import StaticGlobeFallback from './StaticGlobeFallback'

afterEach(cleanup)

describe('StaticGlobeFallback', () => {
    it('renders an accessible SVG globe with no WebGL canvas', () => {
        const { container } = render(<StaticGlobeFallback />)
        // Pure SVG — must never create a <canvas>/WebGL context.
        expect(container.querySelector('canvas')).toBeNull()
        const svg = screen.getByRole('img')
        expect(svg.tagName.toLowerCase()).toBe('svg')
    })

    it('plots country markers for the visible hemisphere', () => {
        const { container } = render(<StaticGlobeFallback />)
        // Each visible country renders a <g> with two marker circles; there
        // should be at least a few facing the default view.
        const markerGroups = container.querySelectorAll('svg > g')
        expect(markerGroups.length).toBeGreaterThan(0)
    })
})
