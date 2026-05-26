import { rgbToHsl, hslToRgb, rgbToHex, type RGB } from '@/lib/color'

export type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic'

export interface HarmonyScheme {
  type: HarmonyType
  label: string
  colors: RGB[]
}

/** Normalise a hue value to [0, 1). */
function normHue(h: number): number {
  return ((h % 1) + 1) % 1
}

/**
 * Generate all five harmonic colour schemes from a base colour.
 * Harmonies are produced by rotating the hue channel of HSL while
 * preserving saturation and lightness.
 */
export function generateHarmonies(base: RGB): HarmonyScheme[] {
  const hsl = rgbToHsl(base)
  const { s, l } = hsl

  return [
    {
      type: 'complementary',
      label: 'Complementary',
      colors: [
        base,
        hslToRgb({ h: normHue(hsl.h + 0.5), s, l }),
      ],
    },
    {
      type: 'analogous',
      label: 'Analogous',
      colors: [
        hslToRgb({ h: normHue(hsl.h - 1 / 12), s, l }),
        base,
        hslToRgb({ h: normHue(hsl.h + 1 / 12), s, l }),
      ],
    },
    {
      type: 'triadic',
      label: 'Triadic',
      colors: [
        base,
        hslToRgb({ h: normHue(hsl.h + 1 / 3), s, l }),
        hslToRgb({ h: normHue(hsl.h + 2 / 3), s, l }),
      ],
    },
    {
      type: 'split-complementary',
      label: 'Split Complementary',
      colors: [
        base,
        hslToRgb({ h: normHue(hsl.h + 5 / 12), s, l }),
        hslToRgb({ h: normHue(hsl.h + 7 / 12), s, l }),
      ],
    },
    {
      type: 'tetradic',
      label: 'Tetradic',
      colors: [
        base,
        hslToRgb({ h: normHue(hsl.h + 1 / 4), s, l }),
        hslToRgb({ h: normHue(hsl.h + 1 / 2), s, l }),
        hslToRgb({ h: normHue(hsl.h + 3 / 4), s, l }),
      ],
    },
  ]
}

/** Check whether a colour is essentially achromatic (saturation near zero). */
export function isAchromatic(base: RGB): boolean {
  const hsl = rgbToHsl(base)
  return hsl.s < 0.02
}

/** Hex string for an RGB colour. */
export function rgbToHexStr(color: RGB): string {
  return rgbToHex(color)
}
