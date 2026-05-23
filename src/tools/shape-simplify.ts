// Separable box blur — O(w×h) per pass regardless of radius.
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

function boxBlur(data: ImageData, radius: number): ImageData {
  const { width: w, height: h } = data
  const tmp = new Uint8ClampedArray(data.data.length)
  const out = new Uint8ClampedArray(data.data.length)
  blurH(data.data, tmp, w, h, radius)
  blurV(tmp, out, w, h, radius)
  return new ImageData(out, w, h)
}

function posterize(data: ImageData, levels: number): ImageData {
  const step = 255 / (levels - 1)
  const out = new Uint8ClampedArray(data.data.length)
  for (let i = 0; i < data.data.length; i += 4) {
    out[i]     = Math.round(data.data[i]     / step) * step
    out[i + 1] = Math.round(data.data[i + 1] / step) * step
    out[i + 2] = Math.round(data.data[i + 2] / step) * step
    out[i + 3] = data.data[i + 3]
  }
  return new ImageData(out, data.width, data.height)
}

export function applyShapeSimplify(data: ImageData, blurRadius: number, levels: number): ImageData {
  return posterize(boxBlur(data, blurRadius), levels)
}
