export interface AspectRatio {
  label: string
  w: number
  h: number
}

export const ASPECT_PRESETS: AspectRatio[] = [
  // Square
  { label: '1:1', w: 1, h: 1 },
  // Standard
  { label: '3:4', w: 3, h: 4 },
  { label: '4:5', w: 4, h: 5 },
  { label: '5:7', w: 5, h: 7 },
  { label: '8:10', w: 8, h: 10 },
  // Landscape
  { label: '16:9', w: 16, h: 9 },
  { label: '2:1', w: 2, h: 1 },
  { label: '3:2', w: 3, h: 2 },
  // Panoramic
  { label: '3:1', w: 3, h: 1 },
]

export interface Rect {
  x: number  // pixels from left
  y: number  // pixels from top
  w: number  // width in pixels
  h: number  // height in pixels
}

/** Create a default centered crop rect filling ~80% of the image, constrained to ratio */
export function defaultRect(imgW: number, imgH: number, ratio: AspectRatio): Rect {
  let w = imgW * 0.85
  let h = w * (ratio.h / ratio.w)
  if (h > imgH * 0.85) {
    h = imgH * 0.85
    w = h * (ratio.w / ratio.h)
  }
  return {
    x: (imgW - w) / 2,
    y: (imgH - h) / 2,
    w,
    h,
  }
}

/** Clamp rect so it stays fully within the image bounds */
export function clampToImage(rect: Rect, imgW: number, imgH: number): Rect {
  let { x, y, w, h } = rect
  w = Math.min(w, imgW)
  h = Math.min(h, imgH)
  x = Math.max(0, Math.min(x, imgW - w))
  y = Math.max(0, Math.min(y, imgH - h))
  return { x, y, w, h }
}

/**
 * Resize the rect by dragging one of its corners.
 * Keeps the opposite corner fixed and maintains the target aspect ratio.
 * `corner` is 0=TL, 1=TR, 2=BL, 3=BR.
 * The returned rect is clamped to image bounds.
 */
export function resizeCorner(
  rect: Rect,
  corner: number,
  toX: number,
  toY: number,
  ratio: AspectRatio,
  imgW: number,
  imgH: number,
): Rect {
  // Opposite corner index (0↔3, 1↔2)
  const opp = 3 - corner

  // Anchor = opposite corner position
  const ax = opp & 1 ? rect.x + rect.w : rect.x
  const ay = opp & 2 ? rect.y + rect.h : rect.y

  // Compute raw bounds
  let left = Math.min(ax, toX)
  let top = Math.min(ay, toY)
  let right = Math.max(ax, toX)
  let bottom = Math.max(ay, toY)

  let w = right - left
  let h = bottom - top

  // Enforce minimum size (24×24)
  if (w < 24) w = 24
  if (h < 24) h = 24

  // Constrain to aspect ratio using the anchor corner
  const target = ratio.w / ratio.h
  if (w / h > target) {
    // Too wide — constrain by height
    w = h * target
  } else {
    // Too tall — constrain by width
    h = w / target
  }

  // Re-enforce minimum after aspect-ratio clamping (#2)
  // The aspect-ratio step above can undo the bare minimum check,
  // e.g. target=1.78, w=24, h=24 → w/h=1 < 1.78 → h=24/1.78=13.5 < 24.
  // Walk both axes until minimum is satisfied while preserving ratio.
  if (w < 24 || h < 24) {
    if (w < 24) {
      w = 24
      h = w / target
    }
    if (h < 24) {
      h = 24
      w = h * target
    }
  }

  // Recompute left/right/top/bottom so anchor stays fixed
  if (ax <= toX) {
    right = ax + w
  } else {
    left = ax - w
  }
  if (ay <= toY) {
    bottom = ay + h
  } else {
    top = ay - h
  }

  return clampToImage({ x: left, y: top, w: right - left, h: bottom - top }, imgW, imgH)
}

/**
 * Resize the rect by dragging one of its edge midpoints (0=top, 1=right, 2=bottom, 3=left).
 * The opposite edge stays fixed; the adjacent edges shift symmetrically to maintain
 * the target aspect ratio. Clamped to image bounds.
 */
export function resizeEdge(
  rect: Rect,
  edge: number,
  toX: number,
  toY: number,
  ratio: AspectRatio,
  imgW: number,
  imgH: number,
): Rect {
  const target = ratio.w / ratio.h
  const MIN = 24
  let { x, y, w, h } = rect

  switch (edge) {
    case 0: { // top — drag vertically, bottom stays fixed
      const newH = Math.max(MIN, (rect.y + rect.h) - toY)
      const newW = newH * target
      y = rect.y + rect.h - newH
      x = rect.x + (rect.w - newW) / 2
      w = newW
      h = newH
      break
    }
    case 1: { // right — drag horizontally, left stays fixed
      const newW = Math.max(MIN, toX - rect.x)
      const newH = newW / target
      y = rect.y + (rect.h - newH) / 2
      w = newW
      h = newH
      break
    }
    case 2: { // bottom — drag vertically, top stays fixed
      const newH = Math.max(MIN, toY - rect.y)
      const newW = newH * target
      x = rect.x + (rect.w - newW) / 2
      w = newW
      h = newH
      break
    }
    case 3: { // left — drag horizontally, right stays fixed
      const newW = Math.max(MIN, (rect.x + rect.w) - toX)
      const newH = newW / target
      y = rect.y + (rect.h - newH) / 2
      w = newW
      h = newH
      break
    }
  }

  return clampToImage({ x, y, w, h }, imgW, imgH)
}

/** Translate the rect by (dx, dy), keeping it within image bounds */
export function translateRect(rect: Rect, dx: number, dy: number, imgW: number, imgH: number): Rect {
  return clampToImage({ ...rect, x: rect.x + dx, y: rect.y + dy }, imgW, imgH)
}
