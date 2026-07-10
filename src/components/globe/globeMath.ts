/**
 * Shared, dependency-free geometry helpers for the globe.
 *
 * Every part of the scene (land dots, country markers, arcs, the a11y focus
 * logic) must agree on how a geographic coordinate maps onto the sphere, so
 * that dots, markers and arcs line up exactly. This is the single source of
 * truth for that conversion — matching the mapping the original globe used.
 */

const DEG = Math.PI / 180

export type Vec3 = [number, number, number]

/**
 * Convert a lat/lng (degrees) to a point on a sphere of the given radius.
 * North pole (lat = 90) maps to +Y.
 */
export const latLngToVec3 = (lat: number, lng: number, radius: number): Vec3 => {
  const phi = (90 - lat) * DEG
  const theta = (lng + 180) * DEG
  const sinPhi = Math.sin(phi)
  return [
    radius * sinPhi * Math.cos(theta),
    radius * Math.cos(phi),
    radius * sinPhi * Math.sin(theta),
  ]
}

/** Great-circle angular distance (radians) between two lat/lng points. */
export const angularDistance = (
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): number => {
  const a = latLngToVec3(latA, lngA, 1)
  const b = latLngToVec3(latB, lngB, 1)
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  return Math.acos(Math.max(-1, Math.min(1, dot)))
}
