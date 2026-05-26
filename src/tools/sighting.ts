export type SightingMode = 'angle' | 'ratio' | 'plumb'

export interface Point {
  x: number
  y: number
}

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Angle of the line AB relative to the positive x-axis,
 * normalised to 0–180°.
 */
export function angleBetween(a: Point, b: Point): number {
  const raw = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
  return ((raw % 180) + 180) % 180
}

/**
 * Ratio of distance(A,B) : distance(B,C).
 * Returns Infinity if B and C coincide.
 */
export function ratioBetween(a: Point, b: Point, c: Point): number {
  const d1 = distance(a, b)
  const d2 = distance(b, c)
  if (d2 === 0) return Infinity
  return d1 / d2
}

/** Format an angle for display. */
export function formatAngle(deg: number): string {
  return `${deg.toFixed(1)}°`
}

/** Format a ratio as `X.X:1` or `1:X.X`. */
export function formatRatio(r: number): string {
  if (!Number.isFinite(r)) return '—'
  return r >= 1 ? `${r.toFixed(2)}:1` : `1:${(1 / r).toFixed(2)}`
}
