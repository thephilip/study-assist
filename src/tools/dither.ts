import { cloneImageData } from '@/lib/canvas'

export type DitherAlgorithm = 'floyd-steinberg' | 'atkinson' | 'bayer-4' | 'bayer-8'
export type DitherMode = 'grayscale' | 'color'

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function quantize(v: number, levels: number): number {
  const step = 255 / (levels - 1)
  return clamp(Math.round(v / step) * step, 0, 255)
}

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// --- Error-diffusion ---

type Offset = [dx: number, dy: number, weight: number]

const FLOYD_STEINBERG: Offset[] = [
  [ 1, 0, 7 / 16],
  [-1, 1, 3 / 16],
  [ 0, 1, 5 / 16],
  [ 1, 1, 1 / 16],
]

const ATKINSON: Offset[] = [
  [ 1, 0, 1 / 8],
  [ 2, 0, 1 / 8],
  [-1, 1, 1 / 8],
  [ 0, 1, 1 / 8],
  [ 1, 1, 1 / 8],
  [ 0, 2, 1 / 8],
]

function diffuse(
  r: Float32Array, g: Float32Array, b: Float32Array,
  x: number, y: number, w: number, h: number,
  er: number, eg: number, eb: number,
  offsets: Offset[],
): void {
  for (const [dx, dy, wt] of offsets) {
    const nx = x + dx
    const ny = y + dy
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      const ni = ny * w + nx
      r[ni] += er * wt
      g[ni] += eg * wt
      b[ni] += eb * wt
    }
  }
}

function errorDiffusion(data: ImageData, offsets: Offset[], levels: number, mode: DitherMode): ImageData {
  const { width, height } = data
  const n = width * height

  const rf = new Float32Array(n)
  const gf = new Float32Array(n)
  const bf = new Float32Array(n)

  for (let i = 0; i < n; i++) {
    rf[i] = data.data[i * 4]
    gf[i] = data.data[i * 4 + 1]
    bf[i] = data.data[i * 4 + 2]
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x

      if (mode === 'grayscale') {
        const l = luma(rf[i], gf[i], bf[i])
        const ql = quantize(l, levels)
        const err = l - ql
        rf[i] = gf[i] = bf[i] = ql
        diffuse(rf, gf, bf, x, y, width, height, err, err, err, offsets)
      } else {
        const qr = quantize(rf[i], levels); const er = rf[i] - qr; rf[i] = qr
        const qg = quantize(gf[i], levels); const eg = gf[i] - qg; gf[i] = qg
        const qb = quantize(bf[i], levels); const eb = bf[i] - qb; bf[i] = qb
        diffuse(rf, gf, bf, x, y, width, height, er, eg, eb, offsets)
      }
    }
  }

  const out = cloneImageData(data)
  for (let i = 0; i < n; i++) {
    out.data[i * 4]     = rf[i]
    out.data[i * 4 + 1] = gf[i]
    out.data[i * 4 + 2] = bf[i]
  }
  return out
}

// --- Ordered (Bayer) dithering ---

const BAYER_4: number[][] = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5],
]

const BAYER_8: number[][] = [
  [ 0, 32,  8, 40,  2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
]

function ordered(data: ImageData, matrix: number[][], size: number, levels: number, mode: DitherMode): ImageData {
  const { width, height } = data
  const out = cloneImageData(data)
  const spread = 255 / (levels - 1)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      // threshold in (-0.5, 0.5)
      const t = matrix[y % size][x % size] / (size * size) - 0.5

      if (mode === 'grayscale') {
        const l = luma(data.data[i], data.data[i + 1], data.data[i + 2])
        const v = clamp(quantize(l + t * spread, levels), 0, 255)
        out.data[i] = v; out.data[i + 1] = v; out.data[i + 2] = v
      } else {
        out.data[i]     = clamp(quantize(data.data[i]     + t * spread, levels), 0, 255)
        out.data[i + 1] = clamp(quantize(data.data[i + 1] + t * spread, levels), 0, 255)
        out.data[i + 2] = clamp(quantize(data.data[i + 2] + t * spread, levels), 0, 255)
      }
    }
  }
  return out
}

// --- Public API ---

export function applyDither(
  data: ImageData,
  algorithm: DitherAlgorithm,
  mode: DitherMode,
  levels: number,
): ImageData {
  switch (algorithm) {
    case 'floyd-steinberg': return errorDiffusion(data, FLOYD_STEINBERG, levels, mode)
    case 'atkinson':        return errorDiffusion(data, ATKINSON, levels, mode)
    case 'bayer-4':         return ordered(data, BAYER_4, 4, levels, mode)
    case 'bayer-8':         return ordered(data, BAYER_8, 8, levels, mode)
  }
}
