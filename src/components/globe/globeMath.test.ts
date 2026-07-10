import { describe, it, expect } from 'vitest'
import { latLngToVec3, angularDistance } from './globeMath'

describe('latLngToVec3', () => {
    it('places the north pole at +Y', () => {
        const [x, y, z] = latLngToVec3(90, 0, 5)
        expect(y).toBeCloseTo(5, 5)
        expect(x).toBeCloseTo(0, 5)
        expect(z).toBeCloseTo(0, 5)
    })

    it('keeps every point on the sphere of the given radius', () => {
        for (const [lat, lng] of [
            [0, 0],
            [45, 90],
            [-30, -120],
            [12.3, 178],
        ]) {
            const [x, y, z] = latLngToVec3(lat, lng, 2.8)
            expect(Math.hypot(x, y, z)).toBeCloseTo(2.8, 5)
        }
    })
})

describe('angularDistance', () => {
    it('is zero for identical points', () => {
        expect(angularDistance(34, 38, 34, 38)).toBeCloseTo(0, 6)
    })

    it('is pi for antipodal points', () => {
        expect(angularDistance(0, 0, 0, 180)).toBeCloseTo(Math.PI, 5)
    })
})
