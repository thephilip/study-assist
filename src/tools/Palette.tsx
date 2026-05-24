import { useEffect, useRef, useState } from 'react'
import { Panel } from '@/components/Panel'
import { Slider } from '@/components/Slider'
import { drawImageToCanvas, getPixelData } from '@/lib/canvas'
import { rgbToHex, type RGB } from '@/lib/color'
import type { LoadedImage } from '@/hooks/useImage'
import toolStyles from './Tool.module.css'
import styles from './Palette.module.css'

type PaletteResult = { colors: RGB[]; sizes: number[] }

type Props = { image: LoadedImage }

export function Palette({ image }: Props) {
  const [k, setK] = useState(6)
  const [result, setResult] = useState<PaletteResult | null>(null)
  const [running, setRunning] = useState(false)
  const [runId, setRunId] = useState(0)
  const imageDataRef = useRef<ImageData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw source image; stash ImageData for worker
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawImageToCanvas(canvas, image.bitmap)
    imageDataRef.current = getPixelData(canvas)
    setResult(null)
  }, [image])

  // Run k-means; cancel any in-flight worker on dep change or unmount
  useEffect(() => {
    const data = imageDataRef.current
    if (!data) return
    setRunning(true)
    const buffer = data.data.buffer.slice(0)
    const worker = new Worker(
      new URL('../workers/kmeans.worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.postMessage({ buffer, width: data.width, height: data.height, k }, [buffer])
    worker.onmessage = (e: MessageEvent<PaletteResult>) => {
      setResult(e.data)
      setRunning(false)
      worker.terminate()
    }
    return () => { worker.terminate() }
  }, [image, k, runId])

  return (
    <div className={toolStyles.root}>
      <div className={toolStyles.canvasWrap}>
        <canvas ref={canvasRef} className={toolStyles.canvas} role="img" aria-label="Reference image" />
      </div>

      <Panel className={toolStyles.controls}>
        <h2 className={toolStyles.toolName}>Palette</h2>
        <p className={toolStyles.description}>
          K-means clustering finds the dominant colours in the image. Click a swatch to copy its hex value.
        </p>

        <Slider label="Colours" value={k} min={2} max={12} onChange={setK} />

        <button
          className={styles.rerun}
          onClick={() => setRunId(id => id + 1)}
          disabled={running}
        >
          {running ? 'Analysing…' : 'Re-run'}
        </button>

        {result && (
          <div className={styles.swatches}>
            {result.colors.map((color, i) => {
              const hex = rgbToHex(color)
              const pct = Math.round(result.sizes[i] * 100)
              return (
                <button
                  key={i}
                  className={styles.swatch}
                  style={{ background: hex, flexGrow: result.sizes[i] }}
                  onClick={() => navigator.clipboard.writeText(hex)}
                  title={`${hex} · ${pct}% — click to copy`}
                  aria-label={`${hex}, ${pct}% of image`}
                >
                  <span className={styles.swatchLabel}>{hex}</span>
                </button>
              )
            })}
          </div>
        )}

        {result && (
          <div className={styles.list}>
            {result.colors.map((color, i) => {
              const hex = rgbToHex(color)
              return (
                <div key={i} className={styles.row}>
                  <div className={styles.dot} style={{ background: hex }} />
                  <button
                    className={styles.hex}
                    onClick={() => navigator.clipboard.writeText(hex)}
                    aria-label={`Copy ${hex}`}
                    title="Click to copy"
                  >{hex}</button>
                  <span className={styles.pct}>{Math.round(result.sizes[i] * 100)}%</span>
                </div>
              )
            })}
          </div>
        )}

        <p className={styles.empty} aria-live="polite">
          {running && !result ? 'Analysing…' : ''}
        </p>
      </Panel>
    </div>
  )
}
