import { hexToRgb, rgbToLab, labDeltaE } from '@/lib/color'
import type { RGB, LAB } from '@/lib/color'

export type Brand = 'Gamblin' | 'W&N' | 'Williamsburg' | 'Rembrandt'

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
  p('g-pw6',   'Titanium White',            'Gamblin',     'PW6',      '#f2f0ec'),
  p('g-py35l', 'Cadmium Yellow Light',       'Gamblin',     'PY35',     '#ffe234'),
  p('g-py35m', 'Cadmium Yellow Medium',      'Gamblin',     'PY35',     '#ffc723'),
  p('g-py43',  'Yellow Ochre',               'Gamblin',     'PY43',     '#c8922a'),
  p('g-pbr7s', 'Raw Sienna',                 'Gamblin',     'PBr7',     '#c47a30'),
  p('g-pbr7b', 'Burnt Sienna',               'Gamblin',     'PBr7',     '#a33b1f'),
  p('g-pbr7u', 'Burnt Umber',                'Gamblin',     'PBr7',     '#5c2e12'),
  p('g-po20',  'Cadmium Orange',             'Gamblin',     'PO20',     '#f07010'),
  p('g-pr108', 'Cadmium Red Medium',         'Gamblin',     'PR108',    '#d42020'),
  p('g-pr177', 'Alizarin Crimson Permanent', 'Gamblin',     'PR177',    '#8c1831'),
  p('g-pb29',  'Ultramarine Blue',           'Gamblin',     'PB29',     '#1a3b8c'),
  p('g-pb28',  'Cobalt Blue',                'Gamblin',     'PB28',     '#2455a0'),
  p('g-pb15',  'Phthalo Blue',               'Gamblin',     'PB15:3',   '#003070'),
  p('g-pg7',   'Phthalo Green',              'Gamblin',     'PG7',      '#004a3a'),
  p('g-pg18',  'Viridian',                   'Gamblin',     'PG18',     '#3a7a5c'),
  p('g-pbk9',  'Ivory Black',                'Gamblin',     'PBk9',     '#1a1814'),

  // ── Winsor & Newton ──────────────────────────────────────────────────────
  p('wn-pw6',  'Titanium White',             'W&N',         'PW6',      '#f0eeea'),
  p('wn-py43', 'Yellow Ochre',               'W&N',         'PY43',     '#c08820'),
  p('wn-pbr7b','Burnt Sienna',               'W&N',         'PBr7',     '#9e3820'),
  p('wn-pbr7u','Burnt Umber',                'W&N',         'PBr7',     '#582810'),
  p('wn-pr108','Cadmium Red',                'W&N',         'PR108',    '#cc2020'),
  p('wn-pb29', 'French Ultramarine',         'W&N',         'PB29',     '#1c3888'),
  p('wn-pb15', 'Winsor Blue',                'W&N',         'PB15:3',   '#002868'),
  p('wn-pb28', 'Cobalt Blue',                'W&N',         'PB28',     '#204ea0'),
  p('wn-pbk9', 'Ivory Black',                'W&N',         'PBk9',     '#1c1a18'),

  // ── Williamsburg ─────────────────────────────────────────────────────────
  p('wb-pw6',  'Titanium White',             'Williamsburg','PW6',      '#f4f2ef'),
  p('wb-py43', 'Yellow Ochre',               'Williamsburg','PY43',     '#c89230'),
  p('wb-pbr7b','Burnt Sienna',               'Williamsburg','PBr7',     '#a03818'),
  p('wb-pbr7r','Raw Umber',                  'Williamsburg','PBr7',     '#6e4820'),
  p('wb-pb29', 'Ultramarine Blue',           'Williamsburg','PB29',     '#1e3a90'),
  p('wb-pbk9', 'Ivory Black',                'Williamsburg','PBk9',     '#181614'),

  // ── Rembrandt ────────────────────────────────────────────────────────────
  p('rb-pw6',  'Titanium White',             'Rembrandt',   'PW6',      '#f0eeec'),
  p('rb-py35', 'Cadmium Yellow',             'Rembrandt',   'PY35',     '#ffd020'),
  p('rb-py43', 'Yellow Ochre',               'Rembrandt',   'PY43',     '#c48a28'),
  p('rb-pbr7b','Burnt Sienna',               'Rembrandt',   'PBr7',     '#a03a1c'),
  p('rb-pbr7u','Burnt Umber',                'Rembrandt',   'PBr7',     '#5a2a10'),
  p('rb-pr108','Cadmium Red',                'Rembrandt',   'PR108',    '#cc2018'),
  p('rb-pb29', 'Ultramarine Deep',           'Rembrandt',   'PB29',     '#182878'),
  p('rb-pb28', 'Cobalt Blue',                'Rembrandt',   'PB28',     '#1a4898'),
  p('rb-pbk9', 'Ivory Black',                'Rembrandt',   'PBk9',     '#1a1816'),
]

export type SingleMatch = { paint: Pigment; dE: number }
export type MixMatch = { a: Pigment; b: Pigment; aFraction: number; dE: number }

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

export function findBestMix(
  target: LAB,
  paints: Pigment[],
): MixMatch | null {
  if (paints.length < 2) return null
  let best: MixMatch | null = null

  for (let i = 0; i < paints.length; i++) {
    for (let j = i + 1; j < paints.length; j++) {
      const pi = paints[i], pj = paints[j]
      for (let step = 1; step <= 19; step++) {
        const t = step / 20
        const mixed: LAB = {
          l: pi.lab.l * (1 - t) + pj.lab.l * t,
          a: pi.lab.a * (1 - t) + pj.lab.a * t,
          b: pi.lab.b * (1 - t) + pj.lab.b * t,
        }
        const dE = labDeltaE(target, mixed)
        if (!best || dE < best.dE) {
          // normalise so aFraction is always the larger share
          const [a, b, aFraction] = t <= 0.5
            ? [pi, pj, 1 - t]
            : [pj, pi, t]
          best = { a, b, aFraction, dE }
        }
      }
    }
  }
  return best
}
