import { useRef, useEffect, useState } from 'react'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas, getPixelData } from '@/lib/canvas'
import { computeLumaHistogram } from './histogram'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import toolStyles from './Tool.module.css'
import styles from './Histogram.module.css'

const W = 512
const H = 256

type Props = { image: LoadedImage }

type Stats = { min: number; max: number; mean: number }

function drawHistogram(
  ctx: CanvasRenderingContext2D,
  buckets: Uint32Array,
  logScale: boolean,
): void {
  ctx.fillStyle = '#161618'
  ctx.fillRect(0, 0, W, H)

  // Gridlines at 25 / 50 / 75 %
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (const frac of [0.25, 0.5, 0.75]) {
    const y = Math.round(H * (1 - frac)) + 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  const rawMax = Math.max(...buckets)
  if (rawMax === 0) return

  const normalize = logScale
    ? (n: number) => Math.log1p(n) / Math.log1p(rawMax)
    : (n: number) => n / rawMax

  const barW = W / 256

  for (let i = 0; i < 256; i++) {
    const barH = normalize(buckets[i]) * H
    if (barH < 0.5) continue
    const x = (i / 256) * W
    ctx.fillStyle = `rgb(${i},${i},${i})`
    ctx.fillRect(x, H - barH, barW + 0.5, barH)
  }
}

function computeStats(buckets: Uint32Array): Stats {
  let min = -1, max = -1, total = 0, count = 0
  for (let i = 0; i < 256; i++) {
    if (buckets[i] === 0) continue
    if (min === -1) min = i
    max = i
    total += i * buckets[i]
    count += buckets[i]
  }
  return {
    min: min === -1 ? 0 : min,
    max: max === -1 ? 0 : max,
    mean: count > 0 ? Math.round(total / count) : 0,
  }
}

export function Histogram({ image }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [logScale, setLogScale] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const tmp = document.createElement('canvas')
    drawImageToCanvas(tmp, image.bitmap)
    const data = getPixelData(tmp)
    const buckets = computeLumaHistogram(data)

    setStats(computeStats(buckets))

    canvas.width = W
    canvas.height = H
    drawHistogram(canvas.getContext('2d')!, buckets, logScale)
  }, [image, logScale])

  return (
    <div className={toolStyles.root}>
      <CanvasWrap>
        <canvas ref={canvasRef} className={toolStyles.canvas} role="img" aria-label="Luminance histogram" />
      </CanvasWrap>

      <Panel className={toolStyles.controls} toolSlug="histogram">
        <h2 className={toolStyles.toolName}>Histogram</h2>
        <p className={toolStyles.description}>
          Tonal distribution by luminance. Left = shadows, right = highlights.
          Log scale reveals detail in under- or over-represented tones.
        </p>

        <div className={styles.scaleRow}>
          <span className={styles.scaleLabel}>Scale</span>
          <div className={styles.scale}>
            {([false, true] as const).map(isLog => (
              <button
                key={String(isLog)}
                className={`${styles.scaleBtn} ${logScale === isLog ? styles.scaleBtnActive : ''}`}
                onClick={() => setLogScale(isLog)}
                aria-pressed={logScale === isLog}
              >
                {isLog ? 'Log' : 'Linear'}
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <div className={styles.stats}>
            <span className={styles.statsTitle}>Tonal range</span>
            {(
              [
                { label: 'Min', value: stats.min },
                { label: 'Mean', value: stats.mean },
                { label: 'Max', value: stats.max },
              ] as const
            ).map(({ label, value }) => (
              <div key={label} className={styles.statRow}>
                <span className={styles.statLabel}>{label}</span>
                <div
                  className={styles.statSwatch}
                  style={{ background: `rgb(${value},${value},${value})` }}
                />
                <div className={styles.statBar}>
                  <div className={styles.statFill} style={{ width: `${(value / 255) * 100}%` }} />
                </div>
                <span className={styles.statValue}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
