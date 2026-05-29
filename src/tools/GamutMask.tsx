import { useEffect, useRef, useState } from 'react'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas, getPixelData } from '@/lib/canvas'
import { PIGMENTS, type Brand } from '@/lib/pigments'
import { isBrandUnlocked } from '@/lib/entitlements'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import toolStyles from './Tool.module.css'
import styles from './GamutMask.module.css'

// ── Constants ────────────────────────────────────────────────────────────────

const DIAGRAM_SIZE = 360
const GRID = 200
const LAB_MIN = -100
const LAB_RANGE = 200

// ── Inline HSL→RGB for ImageData pixel filling ───────────────────────────────

function hslToRgbChannels(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue = (t: number) => {
    const n = ((t % 1) + 1) % 1
    if (n < 1 / 6) return p + (q - p) * 6 * n
    if (n < 1 / 2) return q
    if (n < 2 / 3) return p + (q - p) * (2 / 3 - n) * 6
    return p
  }
  return [Math.round(hue(h + 1 / 3) * 255), Math.round(hue(h) * 255), Math.round(hue(h - 1 / 3) * 255)]
}

// ── Stats derived from the grid ───────────────────────────────────────────────

type GamutStats = { warmPercent: number; meanChroma: number; totalSamples: number }

function computeStats(grid: Uint32Array): GamutStats {
  let warm = 0, cool = 0, chromaSum = 0, chromaCount = 0

  for (let gj = 0; gj < GRID; gj++) {
    const b = (gj / GRID) * LAB_RANGE + LAB_MIN + LAB_RANGE / GRID / 2
    for (let gi = 0; gi < GRID; gi++) {
      const count = grid[gj * GRID + gi]
      if (count === 0) continue
      const a = (gi / GRID) * LAB_RANGE + LAB_MIN + LAB_RANGE / GRID / 2
      const chroma = Math.sqrt(a * a + b * b)
      chromaSum += chroma * count
      chromaCount += count
      if (b > 0) warm += count; else cool += count
    }
  }

  const total = warm + cool
  return {
    warmPercent: total > 0 ? Math.round((warm / total) * 100) : 50,
    meanChroma: chromaCount > 0 ? Math.round(chromaSum / chromaCount) : 0,
    totalSamples: total,
  }
}

// ── Diagram renderer ─────────────────────────────────────────────────────────

function drawDiagram(
  canvas: HTMLCanvasElement,
  grid: Uint32Array,
  maxCount: number,
  showPigments: boolean,
) {
  const S = DIAGRAM_SIZE
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#0e0e0f'
  ctx.fillRect(0, 0, S, S)

  // ── Heatmap via ImageData ──────────────────────────────────────────────────
  const imgData = ctx.createImageData(S, S)
  const d = imgData.data

  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const a = (px / S) * LAB_RANGE + LAB_MIN     // -100 → +100
      const b = LAB_MIN + LAB_RANGE - (py / S) * LAB_RANGE  // +100 → -100 (flip y)

      const gi = Math.min(GRID - 1, Math.max(0, Math.floor((a - LAB_MIN) / LAB_RANGE * GRID)))
      const gj = Math.min(GRID - 1, Math.max(0, Math.floor((b - LAB_MIN) / LAB_RANGE * GRID)))
      const count = grid[gj * GRID + gi]
      if (count === 0) continue

      const hue = (Math.atan2(b, a) / (2 * Math.PI) + 1) % 1
      const chroma = Math.sqrt(a * a + b * b)
      const sat = Math.min(chroma / 65, 1) * 0.82 + 0.12
      const lit = 0.52 + Math.min(chroma / 100, 1) * 0.08
      const alpha = Math.min(1, 0.18 + Math.sqrt(count / maxCount) * 0.82)

      const [pr, pg, pb] = hslToRgbChannels(hue, sat, lit)
      const idx = (py * S + px) * 4
      d[idx] = pr
      d[idx + 1] = pg
      d[idx + 2] = pb
      d[idx + 3] = Math.round(alpha * 255)
    }
  }
  ctx.putImageData(imgData, 0, 0)

  // ── Reference circle (chroma 80) and axis lines ───────────────────────────
  const center = S / 2
  const scale = S / LAB_RANGE

  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(center, center, 80 * scale, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.setLineDash([3, 5])
  ctx.beginPath()
  ctx.moveTo(0, center); ctx.lineTo(S, center)
  ctx.moveTo(center, 0); ctx.lineTo(center, S)
  ctx.stroke()
  ctx.setLineDash([])

  // ── Axis labels ────────────────────────────────────────────────────────────
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.textAlign = 'center'
  ctx.fillText('+b yellow', center, 14)
  ctx.fillText('−b blue', center, S - 5)
  ctx.textAlign = 'left'
  ctx.fillText('+a red', S - 56, center - 5)
  ctx.textAlign = 'right'
  ctx.fillText('−a green', 56, center - 5)

  // ── Pigment dots ───────────────────────────────────────────────────────────
  if (!showPigments) return

  for (const pig of PIGMENTS) {
    const px = (pig.lab.a - LAB_MIN) / LAB_RANGE * S
    const py = S - (pig.lab.b - LAB_MIN) / LAB_RANGE * S  // flip y
    const unlocked = isBrandUnlocked(pig.brand as Brand)

    ctx.beginPath()
    ctx.arc(px, py, 4, 0, Math.PI * 2)
    if (unlocked) {
      ctx.fillStyle = `rgb(${pig.rgb.r},${pig.rgb.g},${pig.rgb.b})`
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    }
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

type GamutWorkerResult = { grid: ArrayBuffer; maxCount: number }

type Props = { image: LoadedImage }

export function GamutMask({ image }: Props) {
  const diagramRef = useRef<HTMLCanvasElement>(null)
  const [grid, setGrid] = useState<Uint32Array | null>(null)
  const [maxCount, setMaxCount] = useState(0)
  const [running, setRunning] = useState(false)
  const [showPigments, setShowPigments] = useState(true)
  const [stats, setStats] = useState<GamutStats | null>(null)

  // ── Send image to worker ───────────────────────────────────────────────────
  useEffect(() => {
    const tmp = document.createElement('canvas')
    drawImageToCanvas(tmp, image.bitmap)
    const data = getPixelData(tmp)
    const buffer = data.data.buffer.slice(0)

    setGrid(null)
    setStats(null)
    setRunning(true)

    const worker = new Worker(
      new URL('../workers/gamut.worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.postMessage({ buffer, width: data.width, height: data.height }, [buffer])
    worker.onmessage = (e: MessageEvent<GamutWorkerResult>) => {
      const g = new Uint32Array(e.data.grid)
      setGrid(g)
      setMaxCount(e.data.maxCount)
      setStats(computeStats(g))
      setRunning(false)
      worker.terminate()
    }
    return () => { worker.terminate() }
  }, [image])

  // ── Redraw diagram when data or overlay changes ────────────────────────────
  useEffect(() => {
    const canvas = diagramRef.current
    if (!canvas || !grid) return
    canvas.width = DIAGRAM_SIZE
    canvas.height = DIAGRAM_SIZE
    drawDiagram(canvas, grid, maxCount, showPigments)
  }, [grid, maxCount, showPigments])

  const coolPercent = stats ? 100 - stats.warmPercent : 50

  return (
    <div className={toolStyles.root}>
      <CanvasWrap>
        <canvas
          ref={diagramRef}
          className={styles.diagram}
          role="img"
          aria-label="LAB a*–b* gamut map"
        />
        {running && (
          <div className={styles.spinnerOverlay} aria-live="polite">
            Analysing…
          </div>
        )}
      </CanvasWrap>

      <Panel className={toolStyles.controls} toolSlug="gamut-mask">
        <h2 className={toolStyles.toolName}>Gamut Map</h2>
        <p className={toolStyles.description}>
          Plots every sampled colour on the LAB a*–b* plane. The centre is
          neutral grey; distance from centre is chroma.
        </p>

        <button
          className={`${styles.overlayBtn} ${showPigments ? styles.overlayBtnActive : ''}`}
          onClick={() => setShowPigments(p => !p)}
          aria-pressed={showPigments}
        >
          Pigment overlay {showPigments ? 'on' : 'off'}
        </button>

        {stats && (
          <div className={styles.stats}>
            <span className={styles.statsTitle}>Analysis</span>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Temperature</span>
              <div className={styles.tempBar}>
                <div
                  className={styles.tempCool}
                  style={{ width: `${coolPercent}%` }}
                />
                <div
                  className={styles.tempWarm}
                  style={{ width: `${stats.warmPercent}%` }}
                />
              </div>
              <span className={styles.statValue}>
                {stats.warmPercent > 55 ? 'Warm' : stats.warmPercent < 45 ? 'Cool' : 'Neutral'}
              </span>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Chroma</span>
              <div className={styles.chromaBar}>
                <div
                  className={styles.chromaFill}
                  style={{ width: `${Math.min(100, (stats.meanChroma / 60) * 100)}%` }}
                />
              </div>
              <span className={styles.statValue}>{stats.meanChroma}</span>
            </div>
          </div>
        )}

        {showPigments && (
          <div className={styles.legend}>
            <span className={styles.legendTitle}>Pigments</span>
            <p className={styles.legendNote}>
              Coloured dots = unlocked brands. Dim dots = locked brands.
            </p>
          </div>
        )}
      </Panel>
    </div>
  )
}
