import { mapPixels } from '@/lib/canvas'

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function applyNotan(data: ImageData, threshold: number): ImageData {
  return mapPixels(data, (r, g, b, a) => {
    const v = luma(r, g, b) >= threshold ? 255 : 0
    return [v, v, v, a]
  })
}
