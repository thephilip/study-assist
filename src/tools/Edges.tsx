import { useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { useCompare } from '@/hooks/useCompare'
import { applyEdges } from './edges'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { downloadCanvas } from '@/lib/export'
import toolStyles from './Tool.module.css'
import styles from './Edges.module.css'

type EdgeColor = 'light' | 'dark'
type Props = { image: LoadedImage; originalImage: LoadedImage; onApply: (canvas: HTMLCanvasElement) => void }

export function Edges({ image, originalImage, onApply }: Props) {
  const [blurRadius, setBlurRadius] = useState(2)
  const [threshold, setThreshold] = useState(20)
  const [opacity, setOpacity] = useState(80)
  const [edgeColor, setEdgeColor] = useState<EdgeColor>('light')

  const processData = useCallback(
    (data: ImageData) => applyEdges(data, blurRadius, threshold, opacity / 100, edgeColor),
    [blurRadius, threshold, opacity, edgeColor],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData, originalImage)

  useRegisterToolActions('Edges', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-png', label: 'Save PNG', handler: () => { const c = processedRef.current; if (c) downloadCanvas(c, 'edges.png') } },
    { id: 'use-as-source', label: 'Use as source', handler: () => { const c = processedRef.current; if (c) onApply(c) } },
  ], [compare, toggleCompare, processedRef, onApply]))

  return (
    <div className={toolStyles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${toolStyles.canvas} ${!compare ? toolStyles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={toolStyles.canvas} role="img" aria-label="Edge detection overlay" />
      </CanvasWrap>

      <Panel className={toolStyles.controls}>
        <h2 className={toolStyles.toolName}>Edges</h2>
        <p className={toolStyles.description}>
          Sobel edge detection overlaid on the image. Increase blur to find
          large compositional edges; lower threshold to reveal more.
        </p>

        <Slider label="Blur"      value={blurRadius} min={0} max={20} onChange={setBlurRadius} />
        <Slider label="Threshold" value={threshold}  min={1} max={100} onChange={setThreshold} />
        <Slider label="Opacity"   value={opacity}    min={10} max={100} onChange={setOpacity} />

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Line colour</span>
          <div className={styles.toggle}>
            {(['light', 'dark'] as EdgeColor[]).map(c => (
              <button
                key={c}
                className={`${styles.toggleBtn} ${edgeColor === c ? styles.toggleBtnActive : ''}`}
                onClick={() => setEdgeColor(c)}
                aria-pressed={edgeColor === c}
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
