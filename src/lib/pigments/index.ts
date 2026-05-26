import { hexToRgb, rgbToLab, labDeltaE } from '@/lib/color'
import type { RGB, LAB } from '@/lib/color'

// premium.ts is gitignored — absent on public clones; gracefully degrades to no locked-brand pigments
const _premiumMods = import.meta.glob<{ PREMIUM_SPECS: [string, string, string, string, string][] }>(
  './premium.ts',
  { eager: true },
)
const PREMIUM_SPECS = _premiumMods['./premium.ts']?.PREMIUM_SPECS ?? []

export type Brand = 'Gamblin' | 'W&N' | 'Williamsburg' | 'Rembrandt' | 'Utrecht' | 'Geneva'

export const FREE_BRANDS: Brand[] = ['Gamblin']
export const ALL_BRANDS: Brand[] = ['Gamblin', 'W&N', 'Williamsburg', 'Rembrandt', 'Utrecht', 'Geneva']
export function isBrandFree(brand: Brand): boolean {
  return (FREE_BRANDS as string[]).includes(brand)
}

export type Pigment = {
  id: string
  name: string
  brand: Brand
  pigmentCode: string
  rgb: RGB
  lab: LAB
}

function p(
  id: string,
  name: string,
  brand: Brand,
  pigmentCode: string,
  hex: string,
): Pigment {
  const rgb = hexToRgb(hex)
  return { id, name, brand, pigmentCode, rgb, lab: rgbToLab(rgb) }
}

// Hex values sourced from manufacturer swatch cards and handprint.com reference data.
// Measured under D65 illuminant. Treat as reference approximations, not spectral data.
export const PIGMENTS: Pigment[] = [
  // ── Gamblin ──────────────────────────────────────────────────────────────
  p('g-pw6',   'Titanium White',            'Gamblin', 'PW6',    '#f2f0ec'),
  p('g-py35l', 'Cadmium Yellow Light',      'Gamblin', 'PY35',   '#ffe234'),
  p('g-py35m', 'Cadmium Yellow Medium',     'Gamblin', 'PY35',   '#ffc723'),
  p('g-py43',  'Yellow Ochre',              'Gamblin', 'PY43',   '#c8922a'),
  p('g-pbr7s', 'Raw Sienna',               'Gamblin', 'PBr7',   '#c47a30'),
  p('g-pbr7b', 'Burnt Sienna',             'Gamblin', 'PBr7',   '#a33b1f'),
  p('g-pbr7u', 'Burnt Umber',              'Gamblin', 'PBr7',   '#5c2e12'),
  p('g-po20',  'Cadmium Orange',           'Gamblin', 'PO20',   '#f07010'),
  p('g-pr108', 'Cadmium Red Medium',       'Gamblin', 'PR108',  '#d42020'),
  p('g-pr177', 'Alizarin Crimson Permanent','Gamblin', 'PR177', '#8c1831'),
  p('g-pb29',  'Ultramarine Blue',         'Gamblin', 'PB29',   '#1a3b8c'),
  p('g-pb28',  'Cobalt Blue',              'Gamblin', 'PB28',   '#2455a0'),
  p('g-pb15',  'Phthalo Blue',             'Gamblin', 'PB15:3', '#003070'),
  p('g-pg7',   'Phthalo Green',            'Gamblin', 'PG7',    '#004a3a'),
  p('g-pg18',  'Viridian',                 'Gamblin', 'PG18',   '#3a7a5c'),
  p('g-pbk9',  'Ivory Black',              'Gamblin', 'PBk9',   '#1a1814'),

  // Premium brand data — loaded from gitignored src/lib/pigments/premium.ts
  ...PREMIUM_SPECS.map(([id, name, brand, code, hex]) =>
    p(id, name, brand as Brand, code, hex)
  ),
]

export type SingleMatch = { paint: Pigment; dE: number }
export type MixMatch = { a: Pigment; b: Pigment; aFraction: number; dE: number }
export type ThreePaintMixMatch = {
  a: Pigment
  b: Pigment
  c: Pigment
  fractions: [number, number, number]  // a, b, c — sum to 1
  dE: number
}

const MIX_COUNT = 5        // top-N mixes to return
const BLEND_STEPS = 19     // 5% increments (same as before)

export function findTopSingles(
  target: LAB,
  paints: Pigment[],
  count = 3,
): SingleMatch[] {
  return paints
    .map(paint => ({ paint, dE: labDeltaE(target, paint.lab) }))
    .sort((a, b) => a.dE - b.dE)
    .slice(0, count)
}

export type MixResults = {
  twoPaint: MixMatch[]
  threePaint: ThreePaintMixMatch[]
}

/**
 * Returns the top-N 2-paint mixes and top-N 3-paint mixes.
 * Free tier shows only twoPaint[0]; pro tier unlocks the rest.
 */
export function findBestMixes(
  target: LAB,
  paints: Pigment[],
): MixResults | null {
  if (paints.length < 2) return null

  // ── 2-paint mixes ──────────────────────────────────────────────────────
  const twoPaint: MixMatch[] = []

  for (let i = 0; i < paints.length; i++) {
    for (let j = i + 1; j < paints.length; j++) {
      const pi = paints[i], pj = paints[j]
      for (let step = 1; step <= BLEND_STEPS; step++) {
        const t = step / (BLEND_STEPS + 1)
        const mixed: LAB = {
          l: pi.lab.l * (1 - t) + pj.lab.l * t,
          a: pi.lab.a * (1 - t) + pj.lab.a * t,
          b: pi.lab.b * (1 - t) + pj.lab.b * t,
        }
        const dE = labDeltaE(target, mixed)
        // normalise so aFraction is always the larger share
        const [a, b, aFraction] = t <= 0.5
          ? [pi, pj, 1 - t]
          : [pj, pi, t]
        twoPaint.push({ a, b, aFraction, dE })
      }
    }
  }

  twoPaint.sort((a, b) => a.dE - b.dE)

  // ── 3-paint mixes ──────────────────────────────────────────────────────
  const threePaint: ThreePaintMixMatch[] = []

  if (paints.length >= 3) {
    // Try equal-weight (1/3 each) + a few biased ratios for each triple.
    // O(n³) with ~80 paints → ~82k triples × 3 ratios ≈ 250k evaluations.
    const ratios: [number, number, number][] = [
      [1/3, 1/3, 1/3],
      [0.5, 0.3, 0.2],
      [0.6, 0.2, 0.2],
    ]

    for (let i = 0; i < paints.length; i++) {
      for (let j = i + 1; j < paints.length; j++) {
        for (let k = j + 1; k < paints.length; k++) {
          const pi = paints[i], pj = paints[j], pk = paints[k]
          for (const [fA, fB, fC] of ratios) {
            const mixed: LAB = {
              l: pi.lab.l * fA + pj.lab.l * fB + pk.lab.l * fC,
              a: pi.lab.a * fA + pj.lab.a * fB + pk.lab.a * fC,
              b: pi.lab.b * fA + pj.lab.b * fB + pk.lab.b * fC,
            }
            const dE = labDeltaE(target, mixed)
            threePaint.push({
              a: pi, b: pj, c: pk,
              fractions: [fA, fB, fC],
              dE,
            })
          }
        }
      }
    }

    threePaint.sort((a, b) => a.dE - b.dE)
  }

  return {
    twoPaint: twoPaint.slice(0, MIX_COUNT),
    threePaint: threePaint.slice(0, MIX_COUNT),
  }
}

/**
 * Convenience: returns the single best 2-paint mix (free-tier behaviour).
 * Delegates to findBestMixes internally.
 */
export function findBestMix(
  target: LAB,
  paints: Pigment[],
): MixMatch | null {
  const results = findBestMixes(target, paints)
  return results?.twoPaint[0] ?? null
}
