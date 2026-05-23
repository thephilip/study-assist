import type { RGB } from '@/lib/color'

export function sampleRegion(data: ImageData, cx: number, cy: number, radius: number): RGB {
  let r = 0, g = 0, b = 0, count = 0
  const r2 = radius * radius

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue
      const px = Math.round(cx + dx)
      const py = Math.round(cy + dy)
      if (px < 0 || py < 0 || px >= data.width || py >= data.height) continue
      const i = (py * data.width + px) * 4
      r += data.data[i]
      g += data.data[i + 1]
      b += data.data[i + 2]
      count++
    }
  }

  if (count === 0) return { r: 0, g: 0, b: 0 }
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  }
}
