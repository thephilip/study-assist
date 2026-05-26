/**
 * Thumbnail Sketch — brush engine and undo stack.
 *
 * Stores strokes as point arrays and redraws from scratch on undo,
 * keeping memory usage low compared to full ImageData snapshots.
 * The engine operates on an externally-owned <canvas> element.
 */

export type Point = { x: number; y: number; pressure: number }

export type Stroke = {
  points: Point[]
  color: string
  brushSize: number
  eraser: boolean
}

export class SketchEngine {
  private ctx: CanvasRenderingContext2D
  private strokes: Stroke[] = []

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    this.ctx = ctx
  }

  /** Resize the canvas (e.g. when a new image is loaded). Clears all strokes. */
  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.strokes = []
  }

  /** Returns the sketch canvas element. */
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  /** Returns a copy of the stroke history. */
  getStrokes(): Stroke[] {
    return [...this.strokes]
  }

  /** Number of strokes in history (for undo availability). */
  get strokeCount(): number {
    return this.strokes.length
  }

  /** Begins a new stroke with the given brush settings. */
  beginStroke(color: string, brushSize: number, eraser: boolean): void {
    this.strokes.push({ points: [], color, brushSize, eraser })
  }

  /** Extends the current stroke with a new point. */
  extendStroke(point: Point): void {
    const current = this.strokes[this.strokes.length - 1]
    if (!current) return

    const lastPt = current.points[current.points.length - 1]
    current.points.push(point)

    if (lastPt) {
      this.drawSegment(lastPt, point, current)
    } else {
      this.drawDot(point, current)
    }
  }

  /** Finalises the current stroke (trim empty strokes). */
  endStroke(): void {
    const current = this.strokes[this.strokes.length - 1]
    if (current && current.points.length === 0) {
      this.strokes.pop()
    }
  }

  /** Removes the last stroke and redraws everything. */
  undo(): boolean {
    if (this.strokes.length === 0) return false
    this.strokes.pop()
    this.redrawAll()
    return true
  }

  /** Clears the entire sketch. */
  clear(): void {
    this.strokes = []
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private redrawAll(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (const stroke of this.strokes) {
      if (stroke.points.length === 0) continue

      const first = stroke.points[0]
      this.drawDot(first, stroke)
      this.ctx.beginPath()
      this.ctx.moveTo(first.x, first.y)

      for (let i = 1; i < stroke.points.length; i++) {
        const from = stroke.points[i - 1]
        const to = stroke.points[i]
        this.drawSegmentLine(from, to, stroke)
      }
      this.ctx.stroke()
    }
  }

  private prepareCtx(pt: Point, stroke: Stroke): number {
    const pressure = Math.max(0.15, pt.pressure)
    const r = stroke.brushSize * pressure
    this.ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over'
    this.ctx.strokeStyle = stroke.color
    this.ctx.fillStyle = stroke.color
    this.ctx.lineWidth = r * 2
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    return r
  }

  private drawDot(pt: Point, stroke: Stroke): void {
    const r = this.prepareCtx(pt, stroke)
    this.ctx.beginPath()
    this.ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2)
    this.ctx.fill()
  }

  /** Sets up the context for a segment but does NOT stroke — caller must stroke(). */
  private drawSegmentLine(from: Point, to: Point, stroke: Stroke): void {
    const avgPressure = (from.pressure + to.pressure) / 2
    this.prepareCtx({ x: from.x, y: from.y, pressure: avgPressure }, stroke)
    this.ctx.lineTo(to.x, to.y)
  }

  private drawSegment(from: Point, to: Point, stroke: Stroke): void {
    this.ctx.beginPath()
    this.ctx.moveTo(from.x, from.y)
    this.drawSegmentLine(from, to, stroke)
    this.ctx.stroke()
  }
}
