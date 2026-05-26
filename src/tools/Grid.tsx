import { useRef, useEffect, useState, useMemo } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas } from '@/lib/canvas'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { useCompareContext } from '@/context/CompareContext'
import { downloadCanvas } from '@/lib/export'
import { drawGrid } from './grid'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import toolStyles from './Tool.module.css'
import styles from './Grid.module.css'

type LineColor = 'light' | 'dark'

const PRESETS = [
  { label: '2×2', cols: 2, rows: 2 },
  { label: '3×3', cols: 3, rows: 3 },
  { label: '4×4', cols: 4, rows: 4 },
  { label: '3×4', cols: 3, rows: 4 },
]

type Props = { image: LoadedImage; originalImage: LoadedImage; onApply: (canvas: HTMLCanvasElement) => void }

export function Grid({ image, originalImage, onApply }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalRef = useRef<HTMLCanvasElement>(null)
  const [cols, setCols] = useState(3)
  const [rows, setRows] = useState(3)
  const [opacity, setOpacity] = useState(50)
  const [lineColor, setLineColor] = useState<LineColor>('light')
  const { compare, toggleCompare } = useCompareContext()

  useRegisterToolActions('Grid', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-png', label: 'Save PNG', handler: () => { const c = canvasRef.current; if (c) downloadCanvas(c, 'grid.png') } },
    { id: 'use-as-source', label: 'Use as source', handler: () => { const c = canvasRef.current; if (c) onApply(c) } },
  ], [compare, toggleCompare, canvasRef, onApply]))

  // Keep original canvas showing the root original (before any Use as source)
  useEffect(() => {
    const original = originalRef.current
    if (!original) return
    drawImageToCanvas(original, originalImage.bitmap)
  }, [originalImage])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawImageToCanvas(canvas, image.bitmap)
    const ctx = canvas.getContext('2d')!
    drawGrid(ctx, canvas.width, canvas.height, cols, rows, opacity / 100, lineColor)
  }, [image, cols, rows, opacity, lineColor])

  return (
    <div className={toolStyles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${toolStyles.canvas} ${!compare ? toolStyles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={canvasRef} className={toolStyles.canvas} role="img" aria-label="Grid overlay" />
      </CanvasWrap>
      <Panel className={toolStyles.controls}>
        <h2 className={toolStyles.toolName}>Grid</h2>
        <p className={toolStyles.description}>
          Overlay a grid to check proportions and aid transfer to canvas.
        </p>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Presets</span>
          <div className={styles.presets}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                className={`${styles.preset} ${cols === p.cols && rows === p.rows ? styles.active : ''}`}
                onClick={() => { setCols(p.cols); setRows(p.rows) }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Slider label="Columns" value={cols} min={1} max={20} onChange={setCols} />
        <Slider label="Rows"    value={rows} min={1} max={20} onChange={setRows} />
        <Slider label="Opacity" value={opacity} min={5} max={100} onChange={setOpacity} />

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Line colour</span>
          <div className={styles.toggle}>
            {(['light', 'dark'] as LineColor[]).map(c => (
              <button
                key={c}
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
