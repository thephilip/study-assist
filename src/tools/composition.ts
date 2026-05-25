export type Overlay = 'thirds' | 'phi' | 'diagonals' | 'spiral' | 'center'
export type SpiralOrient = 0 | 1 | 2 | 3

const PHI = 1.6180339887

export function drawComposition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  overlay: Overlay,
  opacity: number,
  color: 'light' | 'dark',
  spiralOrient: SpiralOrient,
): void {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color === 'light' ? '#ffffff' : '#000000'
  ctx.lineWidth = 1

  switch (overlay) {
    case 'thirds':    drawThirds(ctx, width, height);              break
    case 'phi':       drawPhi(ctx, width, height);                 break
    case 'diagonals': drawDiagonals(ctx, width, height);           break
    case 'spiral':    drawSpiral(ctx, width, height, spiralOrient); break
    case 'center':    drawCenter(ctx, width, height);              break
  }

  ctx.restore()
}

// axis-aligned lines only — the +0.5 offset sharpens 1px strokes on integer coords
function hline(ctx: CanvasRenderingContext2D, y: number, w: number) {
  const py = Math.round(y) + 0.5
  ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke()
}
function vline(ctx: CanvasRenderingContext2D, x: number, h: number) {
  const px = Math.round(x) + 0.5
  ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke()
}

function drawThirds(ctx: CanvasRenderingContext2D, w: number, h: number) {
  vline(ctx, w / 3, h);     vline(ctx, (w * 2) / 3, h)
  hline(ctx, h / 3, w);     hline(ctx, (h * 2) / 3, w)
}

function drawPhi(ctx: CanvasRenderingContext2D, w: number, h: number) {
  vline(ctx, w / PHI / PHI, h);  vline(ctx, w / PHI, h)
  hline(ctx, h / PHI / PHI, w);  hline(ctx, h / PHI, w)
}

function drawCenter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  vline(ctx, w / 2, h)
  hline(ctx, h / 2, w)
}

function drawDiagonals(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke()
}

// Golden spiral via iterative Fibonacci-rectangle subdivision.
// Each iteration cuts a square from the short side of the current rectangle
// and draws a counterclockwise quarter-circle arc within that square.
// The arc center and angles are derived from the geometry of each cut direction.
type SpirSide = 'right' | 'bottom' | 'left' | 'top'

function spiralArcs(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  side: SpirSide,
  depth: number,
): void {
  if (depth <= 0 || Math.min(w, h) < 1) return
  const s = Math.min(w, h)
  ctx.beginPath()
  if (side === 'right') {
    // square at right: center = bottom-right of rect, arc from top-right to bottom of divider
    ctx.arc(x + w, y + h, s, Math.PI * 1.5, Math.PI, true)
    ctx.stroke()
    spiralArcs(ctx, x, y, w - s, h, 'bottom', depth - 1)
  } else if (side === 'bottom') {
    // square at bottom: center = bottom-left of rect
    ctx.arc(x, y + h, s, 0, Math.PI * 1.5, true)
    ctx.stroke()
    spiralArcs(ctx, x, y, w, h - s, 'left', depth - 1)
  } else if (side === 'left') {
    // square at left: center = top-left of rect
    ctx.arc(x, y, s, Math.PI * 0.5, 0, true)
    ctx.stroke()
    spiralArcs(ctx, x + s, y, w - s, h, 'top', depth - 1)
  } else {
    // square at top: center = top-right of rect
    ctx.arc(x + w, y, s, Math.PI, Math.PI * 0.5, true)
    ctx.stroke()
    spiralArcs(ctx, x, y + s, w, h - s, 'right', depth - 1)
  }
}

function drawSpiral(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  orientation: SpiralOrient,
): void {
  ctx.save()
  // Mirror transforms around canvas centre to produce 4 orientations.
  // Labels (↗ ↖ ↘ ↙) indicate the approximate quadrant of the spiral's focal point.
  ctx.translate(width / 2, height / 2)
  if (orientation === 1) ctx.scale(-1,  1)   // flip horizontal → ↖
  else if (orientation === 2) ctx.scale( 1, -1)   // flip vertical   → ↘
  else if (orientation === 3) ctx.scale(-1, -1)   // flip both       → ↙
  ctx.translate(-width / 2, -height / 2)

  const startSide: SpirSide = width >= height ? 'right' : 'bottom'
  spiralArcs(ctx, 0, 0, width, height, startSide, 8)
  ctx.restore()
}
