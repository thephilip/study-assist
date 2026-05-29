// Gamut analysis worker
// Receives raw ImageData pixels, samples every 4th pixel, converts to LAB,
// and bins into a 200×200 density grid covering a* and b* from -100 to +100.
// Returns the grid as a transferable ArrayBuffer + the peak count for normalisation.

const GRID = 200
const LAB_MIN = -100
const LAB_RANGE = 200

type GamutMessage = { buffer: ArrayBuffer; width: number; height: number }
type GamutResult = { grid: ArrayBuffer; maxCount: number }

self.onmessage = ({ data }: MessageEvent<GamutMessage>) => {
  const { buffer, width, height } = data
  const pixels = new Uint8ClampedArray(buffer)

  const grid = new Uint32Array(GRID * GRID)
  let maxCount = 0

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4
      if (pixels[i + 3] < 128) continue

      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]

      // sRGB → linear
      const lin = (v: number) => {
        const n = v / 255
        return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
      }
      const rl = lin(r), gl = lin(g), bl = lin(b)

      // linear RGB → XYZ (D65)
      const X = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
      const Y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
      const Z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041

      // XYZ → LAB
      const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
      const fx = f(X / 0.95047), fy = f(Y), fz = f(Z / 1.08883)
      const labA = 500 * (fx - fy)
      const labB = 200 * (fy - fz)

      // Bin — clamp extreme values (HDR, neon) to boundary cells
      const gi = Math.min(GRID - 1, Math.max(0, Math.floor((labA - LAB_MIN) / LAB_RANGE * GRID)))
      const gj = Math.min(GRID - 1, Math.max(0, Math.floor((labB - LAB_MIN) / LAB_RANGE * GRID)))

      const idx = gj * GRID + gi
      grid[idx]++
      if (grid[idx] > maxCount) maxCount = grid[idx]
    }
  }

  ;(self as unknown as Worker).postMessage({ grid: grid.buffer, maxCount } satisfies GamutResult, [grid.buffer])
}
