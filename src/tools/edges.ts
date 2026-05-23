// BT.601 luma — consistent with value-map.ts / notan.ts / histogram.ts
function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// Separable box blur on a single-channel float array — O(w×h) per radius
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

// 3×3 Sobel — returns gradient magnitude for each pixel
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

export function applyEdges(
  data: ImageData,
  blurRadius: number,  // 0–20: controls edge scale / noise
  threshold: number,   // 1–100: fraction of max gradient; lower = more edges
  opacity: number,     // 0–1: how strongly the edge colour is blended
  color: 'light' | 'dark',
): ImageData {
  const { width: w, height: h } = data

  // Build single-channel grayscale
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    gray[i] = luma(data.data[i * 4], data.data[i * 4 + 1], data.data[i * 4 + 2])
  }

  const mag = sobelMagnitude(blurGray(gray, w, h, blurRadius), w, h)

  // Adaptive threshold: fraction of the image's own max gradient
  let maxMag = 0
  for (let i = 0; i < mag.length; i++) if (mag[i] > maxMag) maxMag = mag[i]
  const thresh = (threshold / 100) * (maxMag || 1)

  const edgeVal = color === 'light' ? 255 : 0
  const out = new ImageData(new Uint8ClampedArray(data.data), w, h)

  for (let i = 0; i < w * h; i++) {
    if (mag[i] <= thresh) continue
    const j = i * 4
    out.data[j]     = Math.round(data.data[j]     * (1 - opacity) + edgeVal * opacity)
    out.data[j + 1] = Math.round(data.data[j + 1] * (1 - opacity) + edgeVal * opacity)
    out.data[j + 2] = Math.round(data.data[j + 2] * (1 - opacity) + edgeVal * opacity)
  }

  return out
}
