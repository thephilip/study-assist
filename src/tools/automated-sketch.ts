// Automated Sketch Generator
// Combines Shape Simplify (blur + posterize → flat colour planes) with
// edge detection (Sobel linework) composited on top.
//
// Pipeline:
//   1. Box blur → posterize → simplified colour background
//   2. Grayscale → optional blur → Sobel → threshold → edge mask
//   3. Composite edges over simplified colours

// ── Separable box blur (3-pass: H, V, H on RGBA) ──────────────────

function blurH(src: Uint8ClampedArray, dst: Uint8ClampedArray, w: number, h: number, r: number) {
  const scale = 1 / (2 * r + 1)
  for (let y = 0; y < h; y++) {
    let rs = 0, gs = 0, bs = 0
    for (let x = -r; x <= r; x++) {
      const i = (y * w + Math.max(0, x)) * 4
      rs += src[i]; gs += src[i + 1]; bs += src[i + 2]
    }
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      dst[i] = rs * scale; dst[i + 1] = gs * scale; dst[i + 2] = bs * scale; dst[i + 3] = src[i + 3]
      const ai = (y * w + Math.min(w - 1, x + r + 1)) * 4
      const ri = (y * w + Math.max(0, x - r)) * 4
      rs += src[ai] - src[ri]; gs += src[ai + 1] - src[ri + 1]; bs += src[ai + 2] - src[ri + 2]
    }
  }
}

function blurV(src: Uint8ClampedArray, dst: Uint8ClampedArray, w: number, h: number, r: number) {
  const scale = 1 / (2 * r + 1)
  for (let x = 0; x < w; x++) {
    let rs = 0, gs = 0, bs = 0
    for (let y = -r; y <= r; y++) {
      const i = (Math.max(0, y) * w + x) * 4
      rs += src[i]; gs += src[i + 1]; bs += src[i + 2]
    }
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4
      dst[i] = rs * scale; dst[i + 1] = gs * scale; dst[i + 2] = bs * scale; dst[i + 3] = src[i + 3]
      const ai = (Math.min(h - 1, y + r + 1) * w + x) * 4
      const ri = (Math.max(0, y - r) * w + x) * 4
      rs += src[ai] - src[ri]; gs += src[ai + 1] - src[ri + 1]; bs += src[ai + 2] - src[ri + 2]
    }
  }
}

// 2-pass (H+V) gives a tent filter — same approach as shape-simplify.ts.
// A 3-pass (H+V+H) would produce a smoother Gaussian-like result but
// diverges from the existing tool's output, so we stick with 2.
function boxBlur(data: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(data.length)
  const out = new Uint8ClampedArray(data.length)
  blurH(data, tmp, w, h, radius)
  blurV(tmp, out, w, h, radius)
  return out
}

// ── Posterize ─────────────────────────────────────────────────────

function posterize(data: Uint8ClampedArray, _w: number, _h: number, levels: number): void {
  // _w and _h unused — operating on flat RGBA array
  void _w; void _h
  const step = 255 / (levels - 1)
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.round(data[i]     / step) * step
    data[i + 1] = Math.round(data[i + 1] / step) * step
    data[i + 2] = Math.round(data[i + 2] / step) * step
    // alpha unchanged
  }
}

// ── Single-channel blur + Sobel ────────────────────────────────────

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function blurGray(src: Float32Array, w: number, h: number, r: number): Float32Array {
  if (r === 0) return src
  const scale = 1 / (2 * r + 1)
  const tmp = new Float32Array(w * h)
  const dst = new Float32Array(w * h)

  for (let y = 0; y < h; y++) {
    let sum = 0
    for (let x = -r; x <= r; x++) sum += src[y * w + Math.max(0, x)]
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum * scale
      sum += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)]
    }
  }

  for (let x = 0; x < w; x++) {
    let sum = 0
    for (let y = -r; y <= r; y++) sum += tmp[Math.max(0, y) * w + x]
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = sum * scale
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }

  return dst
}

function sobelMagnitude(gray: Float32Array, w: number, h: number): Float32Array {
  const mag = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const tl = gray[(y - 1) * w + x - 1], tc = gray[(y - 1) * w + x], tr = gray[(y - 1) * w + x + 1]
      const ml = gray[y * w + x - 1],                                     mr = gray[y * w + x + 1]
      const bl = gray[(y + 1) * w + x - 1], bc = gray[(y + 1) * w + x], br = gray[(y + 1) * w + x + 1]
      const gx = tr + 2 * mr + br - tl - 2 * ml - bl
      const gy = bl + 2 * bc + br - tl - 2 * tc - tr
      mag[y * w + x] = Math.sqrt(gx * gx + gy * gy)
    }
  }
  return mag
}

// ── Public entry point ────────────────────────────────────────────

export type SketchEdgeColor = 'light' | 'dark'

export function applyAutomatedSketch(
  data: ImageData,
  blurRadius: number,    // 1–40: colour-plane blur
  levels: number,        // 2–10: posterisation levels
  edgeBlur: number,      // 0–10: pre-Sobel blur on edge pass
  threshold: number,     // 1–100: edge threshold (fraction of max)
  edgeOpacity: number,   // 0–1: how strongly edges are drawn
  edgeColor: SketchEdgeColor,
): ImageData {
  const { width: w, height: h } = data
  const src = data.data

  // ── 1. Simplified colour background ──────────────────────────
  // boxBlur allocates fresh output buffers — pass src directly, no need for a bg copy
  const blurred = boxBlur(src, w, h, blurRadius)
  posterize(blurred, w, h, levels)

  // ── 2. Grayscale → Sobel → edge mask ────────────────────────
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    gray[i] = luma(src[i * 4], src[i * 4 + 1], src[i * 4 + 2])
  }

  const mag = sobelMagnitude(blurGray(gray, w, h, edgeBlur), w, h)

  // Adaptive threshold based on image's own max gradient
  let maxMag = 0
  for (let i = 0; i < mag.length; i++) if (mag[i] > maxMag) maxMag = mag[i]
  const thresh = (threshold / 100) * (maxMag || 1)

  // ── 3. Composite edges over background ───────────────────────
  const edgeVal = edgeColor === 'light' ? 255 : 0
  const out = new ImageData(new Uint8ClampedArray(blurred), w, h)

  for (let i = 0; i < w * h; i++) {
    if (mag[i] <= thresh) continue
    const j = i * 4
    out.data[j]     = Math.round(blurred[j]     * (1 - edgeOpacity) + edgeVal * edgeOpacity)
    out.data[j + 1] = Math.round(blurred[j + 1] * (1 - edgeOpacity) + edgeVal * edgeOpacity)
    out.data[j + 2] = Math.round(blurred[j + 2] * (1 - edgeOpacity) + edgeVal * edgeOpacity)
  }

  return out
}
