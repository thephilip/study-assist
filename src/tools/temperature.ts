import { mapPixels } from '@/lib/canvas'
import { rgbToHsl, hslToRgb } from '@/lib/color'

const WARM_HUE = 30 / 360   // orange-amber
const COOL_HUE = 210 / 360  // blue

function warmthScore(h: number, s: number): number {
  if (s === 0) return 0
  const hDeg = h * 360
  let dist = Math.abs(hDeg - 30)
  if (dist > 180) dist = 360 - dist
  // +1 at warm center (30°), -1 at cool center (210°)
  return (1 - (dist / 180) * 2) * s
}

export function applyTemperature(
  data: ImageData,
  intensity: number,  // 0–1: warm/cool saturation strength
  blend: number,      // 0–1: 0 = original, 1 = full temperature map
): ImageData {
  return mapPixels(data, (r, g, b, a) => {
    const { h, s, l } = rgbToHsl({ r, g, b })
    const w = warmthScore(h, s)

    const outH = w >= 0 ? WARM_HUE : COOL_HUE
    const outS = Math.abs(w) * intensity
    const { r: tr, g: tg, b: tb } = hslToRgb({ h: outH, s: outS, l })

    return [
      Math.round(r + (tr - r) * blend),
      Math.round(g + (tg - g) * blend),
      Math.round(b + (tb - b) * blend),
      a,
    ]
  })
}
