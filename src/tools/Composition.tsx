import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas } from '@/lib/canvas'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { downloadCanvas } from '@/lib/export'
import { drawComposition, type Overlay, type SpiralOrient } from './composition'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import toolStyles from './Tool.module.css'
import styles from './Composition.module.css'

type LineColor = 'light' | 'dark'

const OVERLAYS: { label: string; value: Overlay; title: string }[] = [
  { label: 'Thirds',  value: 'thirds',    title: 'Rule of thirds' },
  { label: 'Phi',     value: 'phi',       title: 'Golden ratio (phi) grid' },
  { label: 'Diag.',   value: 'diagonals', title: 'Corner diagonals' },
  { label: 'Spiral',  value: 'spiral',    title: 'Golden spiral' },
  { label: 'Center',  value: 'center',    title: 'Centre crosshair' },
]

const SPIRAL_ORIENTS: { orient: SpiralOrient; label: string }[] = [
  { orient: 0, label: 'TR' },
  { orient: 1, label: 'TL' },
  { orient: 2, label: 'BR' },
  { orient: 3, label: 'BL' },
]

type Props = {
  image: LoadedImage
  originalImage: LoadedImage
  onApply: (canvas: HTMLCanvasElement) => void
}

export function Composition({ image, originalImage, onApply }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalRef = useRef<HTMLCanvasElement>(null)
  const [overlay, setOverlay] = useState<Overlay>('thirds')
  const [opacity, setOpacity] = useState(50)
  const [lineColor, setLineColor] = useState<LineColor>('light')
  const [spiralOrient, setSpiralOrient] = useState<SpiralOrient>(0)
  const [compare, setCompare] = useState(false)
  const toggleCompare = useCallback(() => setCompare(v => !v), [])

  useRegisterToolActions('Composition', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-png', label: 'Save PNG', handler: () => { const c = canvasRef.current; if (c) downloadCanvas(c, 'composition.png') } },
    { id: 'use-as-source', label: 'Use as source', handler: () => { const c = canvasRef.current; if (c) onApply(c) } },
  ], [compare, toggleCompare, canvasRef, onApply]))

  useEffect(() => {
    const canvas = originalRef.current
    if (!canvas) return
    drawImageToCanvas(canvas, originalImage.bitmap)
  }, [originalImage])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawImageToCanvas(canvas, image.bitmap)
    const ctx = canvas.getContext('2d')!
    drawComposition(ctx, canvas.width, canvas.height, overlay, opacity / 100, lineColor, spiralOrient)
  }, [image, overlay, opacity, lineColor, spiralOrient])

  return (
    <div className={toolStyles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${toolStyles.canvas} ${!compare ? toolStyles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={canvasRef} className={toolStyles.canvas} role="img" aria-label="Composition overlay" />
      </CanvasWrap>
      <Panel className={toolStyles.controls}>
        <h2 className={toolStyles.toolName}>Composition</h2>
        <p className={toolStyles.description}>
          Overlay compositional guides to analyse structure and focal points.
        </p>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Overlay</span>
          <div className={styles.presets}>
            {OVERLAYS.map(o => (
              <button
                key={o.value}
                type="button"
                title={o.title}
                className={`${styles.preset} ${overlay === o.value ? styles.active : ''}`}
                onClick={() => setOverlay(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {overlay === 'spiral' && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Orientation</span>
            <div className={styles.toggle}>
              {SPIRAL_ORIENTS.map(({ orient, label }) => (
                <button
                  key={orient}
                  type="button"
                  className={`${styles.toggleBtn} ${spiralOrient === orient ? styles.active : ''}`}
                  onClick={() => setSpiralOrient(orient)}
                  aria-pressed={spiralOrient === orient}
                  aria-label={`${label} — ${orient === 0 || orient === 2 ? 'right' : 'left'}, ${orient < 2 ? 'upper' : 'lower'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Slider label="Opacity" value={opacity} min={5} max={100} onChange={setOpacity} />

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Line colour</span>
          <div className={styles.toggle}>
            {(['light', 'dark'] as LineColor[]).map(c => (
              <button
                key={c}
                type="button"
                className={`${styles.toggleBtn} ${lineColor === c ? styles.active : ''}`}
                onClick={() => setLineColor(c)}
                aria-pressed={lineColor === c}
              >
                {c === 'light' ? 'White' : 'Black'}
              </button>
            ))}
          </div>
        </div>

      </Panel>
    </div>
  )
}
