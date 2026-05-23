import { mapPixels } from '@/lib/canvas'

// ITU-R BT.601 luma coefficients
function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function applyValueMap(data: ImageData, levels: number): ImageData {
  const step = 255 / (levels - 1)
  return mapPixels(data, (r, g, b, a) => {
    const gray = Math.round(luma(r, g, b) / step) * step
    return [gray, gray, gray, a]
  })
}
