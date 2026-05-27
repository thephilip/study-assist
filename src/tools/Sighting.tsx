import { type PointerEvent, useRef, useEffect, useState, useCallback } from 'react'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas } from '@/lib/canvas'
import { CanvasWrap, useZoom } from '@/components/CanvasWrap'
import { useFlip } from '@/context/FlipContext'
import type { LoadedImage } from '@/hooks/useImage'
import {
  type SightingMode,
  type Point,
  distance, angleBetween, ratioBetween,
  formatAngle, formatRatio,
} from './sighting'
import toolStyles from './Tool.module.css'
import styles from './Sighting.module.css'

type Props = { image: LoadedImage }

const HIT_RADIUS = 14

// ── Component ────────────────────────────────────────────────────────────────

export function Sighting({ image }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { scale } = useZoom()
  const { flipX, flipY } = useFlip()

  const [mode, setMode] = useState<SightingMode>('angle')
  const [pins, setPins] = useState<Point[]>([])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [plumbOrient, setPlumbOrient] = useState<'vertical' | 'horizontal'>('vertical')
  const [plumbRatio, setPlumbRatio] = useState(0.5)

  // ── Draw image + overlays ──────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    drawImageToCanvas(canvas, image.bitmap)
    drawOverlays(ctx, canvas.width, canvas.height, mode, pins, plumbOrient, plumbRatio)
  }, [image, mode, pins, plumbOrient, plumbRatio])

  // ── Coordinate helpers ─────────────────────────────────────────────────────

  const toCanvasCoords = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const vx = (clientX - rect.left) * (canvas.width / rect.width)
    const vy = (clientY - rect.top) * (canvas.height / rect.height)
    return {
      x: flipX ? canvas.width - vx : vx,
      y: flipY ? canvas.height - vy : vy,
    }
  }, [flipX, flipY])

  const hitTest = useCallback((pt: Point): number | null => {
    const i = pins.findIndex(p => distance(p, pt) < HIT_RADIUS)
    return i >= 0 ? i : null
  }, [pins])

  // ── Pointer handlers ───────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (scale > 1) return
    const pt = toCanvasCoords(e.clientX, e.clientY)

    if (mode === 'plumb') {
      const canvas = canvasRef.current!
      const ratio = plumbOrient === 'vertical'
        ? pt.x / canvas.width
        : pt.y / canvas.height
      setPlumbRatio(Math.max(0, Math.min(1, ratio)))
      return
    }

    const hit = hitTest(pt)
    if (hit !== null) {
      setDragIdx(hit)
    } else {
      setPins(prev => {
        const maxPins = mode === 'angle' ? 2 : 3
        if (prev.length >= maxPins) return [pt]
        return [...prev, pt]
      })
    }
  }, [scale, mode, pins, toCanvasCoords, hitTest, plumbOrient])

  const handlePointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (scale > 1 || dragIdx === null) return

    if (mode === 'plumb') {
      const pt = toCanvasCoords(e.clientX, e.clientY)
      const canvas = canvasRef.current!
      const ratio = plumbOrient === 'vertical'
        ? pt.x / canvas.width
        : pt.y / canvas.height
      setPlumbRatio(Math.max(0, Math.min(1, ratio)))
      return
    }

    const pt = toCanvasCoords(e.clientX, e.clientY)
    setPins(prev => {
      const next = [...prev]
      next[dragIdx] = pt
      return next
    })
  }, [scale, dragIdx, mode, toCanvasCoords, plumbOrient])

  const handlePointerUp = useCallback(() => {
    setDragIdx(null)
  }, [])

  const handlePointerLeave = useCallback(() => {
    setDragIdx(null)
  }, [])

  // ── Actions ────────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    setPins([])
    setDragIdx(null)
  }, [])

  const switchMode = useCallback((m: SightingMode) => {
    setMode(m)
    setPins([])
    setDragIdx(null)
  }, [])

  // ── Readouts ───────────────────────────────────────────────────────────────

  let angle: number | null = null
  let ratio: { value: number; d1: number; d2: number } | null = null

  if (mode === 'angle' && pins.length >= 2) {
    angle = angleBetween(pins[0], pins[1])
  }
  if (mode === 'ratio' && pins.length >= 3) {
    const d1 = distance(pins[0], pins[1])
    const d2 = distance(pins[1], pins[2])
    ratio = { value: ratioBetween(pins[0], pins[1], pins[2]), d1: Math.round(d1), d2: Math.round(d2) }
  }

  const plumbLabel = plumbOrient === 'vertical' ? 'Vertical' : 'Horizontal'

  return (
    <div className={toolStyles.root}>
      <CanvasWrap>
        <canvas
          ref={canvasRef}
          className={toolStyles.canvas}
          role="img"
          aria-label="Sighting and proportion reference"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          style={{ cursor: scale > 1 ? 'grab' : mode === 'plumb' ? 'crosshair' : 'crosshair' }}
        />
      </CanvasWrap>

      <Panel className={toolStyles.controls} toolSlug="sighting">
        <h2 className={toolStyles.toolName}>Sighting</h2>
        <p className={toolStyles.description}>
          Measure angles, proportions, and alignment in your reference.
        </p>

        {/* Mode selector */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Mode</span>
          <div className={styles.toggle}>
            {(['angle', 'ratio', 'plumb'] as const).map(m => (
              <button
                key={m}
                type="button"
                className={`${styles.modeBtn} ${mode === m ? styles.active : ''}`}
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
              >
                {m === 'angle' ? 'Angle' : m === 'ratio' ? 'Proportion' : 'Plumb'}
              </button>
            ))}
          </div>
        </div>

        {/* Plumb orientation */}
        {mode === 'plumb' && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Orientation</span>
            <div className={styles.toggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${plumbOrient === 'vertical' ? styles.active : ''}`}
                onClick={() => { setPlumbOrient('vertical'); setPlumbRatio(0.5) }}
                aria-pressed={plumbOrient === 'vertical'}
              >
                Vertical
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${plumbOrient === 'horizontal' ? styles.active : ''}`}
                onClick={() => { setPlumbOrient('horizontal'); setPlumbRatio(0.5) }}
                aria-pressed={plumbOrient === 'horizontal'}
              >
                Horizontal
              </button>
            </div>
          </div>
        )}

        {/* Readouts */}
        {mode !== 'plumb' && (
          <div className={styles.readouts}>
            {mode === 'angle' && (
              pins.length < 2
                ? <p className={styles.hint}>Tap the image to place pins</p>
                : angle !== null && (
                  <div className={styles.readoutRow}>
                    <span className={styles.readoutLabel}>Angle</span>
                    <span className={styles.readoutValue}>{formatAngle(angle)}</span>
                  </div>
                )
            )}
            {mode === 'ratio' && (
              pins.length < 3
                ? <p className={styles.hint}>Tap to place {3 - pins.length} more pin{pins.length !== 2 ? 's' : ''}</p>
                : ratio !== null && (
                  <>
                    <div className={styles.readoutRow}>
                      <span className={styles.readoutLabel}>A→B</span>
                      <span className={styles.readoutValue}>{ratio.d1}px</span>
                    </div>
                    <div className={styles.readoutRow}>
                      <span className={styles.readoutLabel}>B→C</span>
                      <span className={styles.readoutValue}>{ratio.d2}px</span>
                    </div>
                    <div className={styles.readoutRow}>
                      <span className={styles.readoutLabel}>Ratio</span>
                      <span className={styles.readoutValue}>{formatRatio(ratio.value)}</span>
                    </div>
                  </>
                )
            )}
            {pins.length > 0 && (
              <button type="button" className={styles.clearBtn} onClick={clear}>
                Clear pins
              </button>
            )}
          </div>
        )}

        {mode === 'plumb' && (
          <p className={styles.hint}>
            Drag across the image to position the {plumbLabel.toLowerCase()} guide
          </p>
        )}
      </Panel>
    </div>
  )
}

// ── Overlay drawing ──────────────────────────────────────────────────────────

function drawOverlays(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  mode: SightingMode,
  pins: Point[],
  plumbOrient: 'vertical' | 'horizontal',
  plumbRatio: number,
) {
  switch (mode) {
    case 'angle': return drawAngleOverlay(ctx, w, h, pins)
    case 'ratio': return drawRatioOverlay(ctx, w, h, pins)
    case 'plumb': return drawPlumbOverlay(ctx, w, h, plumbOrient, plumbRatio)
  }
}

function drawAngleOverlay(ctx: CanvasRenderingContext2D, _w: number, _h: number, pins: Point[]) {
  for (let i = 0; i < pins.length; i++) {
    drawPin(ctx, pins[i], i === 0 ? 'A' : 'B')
  }
  if (pins.length >= 2) {
    drawLine(ctx, pins[0], pins[1])
    // Annotate angle at midpoint
    const mx = (pins[0].x + pins[1].x) / 2
    const my = (pins[0].y + pins[1].y) / 2
    const angle = angleBetween(pins[0], pins[1])
    drawLabel(ctx, formatAngle(angle), mx, my - 14)
  }
}

function drawRatioOverlay(ctx: CanvasRenderingContext2D, _w: number, _h: number, pins: Point[]) {
  const labels = ['A', 'B', 'C']
  for (let i = 0; i < pins.length; i++) {
    drawPin(ctx, pins[i], labels[i])
  }
  if (pins.length >= 2) {
    drawLine(ctx, pins[0], pins[1])
    const mx1 = (pins[0].x + pins[1].x) / 2
    const my1 = (pins[0].y + pins[1].y) / 2
    drawLabel(ctx, `${Math.round(distance(pins[0], pins[1]))}px`, mx1, my1 - 14)
  }
  if (pins.length >= 3) {
    drawLine(ctx, pins[1], pins[2])
    const mx2 = (pins[1].x + pins[2].x) / 2
    const my2 = (pins[1].y + pins[2].y) / 2
    drawLabel(ctx, `${Math.round(distance(pins[1], pins[2]))}px`, mx2, my2 - 14)
  }
}

function drawPlumbOverlay(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  orient: 'vertical' | 'horizontal',
  ratio: number,
) {
  ctx.save()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.setLineDash([8, 5])

  if (orient === 'vertical') {
    const x = ratio * w
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
    // Small crosshair at midpoint
    const cy = h / 2
    ctx.beginPath()
    ctx.arc(x, cy, 4, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    const y = ratio * h
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
    const cx = w / 2
    ctx.beginPath()
    ctx.arc(cx, y, 4, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.restore()
}

// ── Drawing primitives ───────────────────────────────────────────────────────

const PIN_R = 5
const CROSS = 10

function drawPin(ctx: CanvasRenderingContext2D, pt: Point, label?: string) {
  ctx.save()

  // Outer ring
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(pt.x, pt.y, PIN_R, 0, Math.PI * 2)
  ctx.stroke()

  // Inner dot
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2)
  ctx.fill()

  // Subtle crosshair
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pt.x - CROSS, pt.y)
  ctx.lineTo(pt.x + CROSS, pt.y)
  ctx.moveTo(pt.x, pt.y - CROSS)
  ctx.lineTo(pt.x, pt.y + CROSS)
  ctx.stroke()

  // Label
  if (label) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 3
    ctx.fillText(label, pt.x, pt.y - PIN_R - 4)
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

function drawLine(ctx: CanvasRenderingContext2D, a: Point, b: Point) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 3
  ctx.fillText(text, x, y)
  ctx.restore()
}
