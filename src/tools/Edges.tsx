import { useState, useCallback } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { SaveButton } from '@/components/SaveButton'
import { useCompare } from '@/hooks/useCompare'
import { applyEdges } from './edges'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import toolStyles from './Tool.module.css'
import styles from './Edges.module.css'

type EdgeColor = 'light' | 'dark'
type Props = { image: LoadedImage }

export function Edges({ image }: Props) {
  const [blurRadius, setBlurRadius] = useState(2)
  const [threshold, setThreshold] = useState(20)
  const [opacity, setOpacity] = useState(80)
  const [edgeColor, setEdgeColor] = useState<EdgeColor>('light')

  const processData = useCallback(
    (data: ImageData) => applyEdges(data, blurRadius, threshold, opacity / 100, edgeColor),
    [blurRadius, threshold, opacity, edgeColor],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData)

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

        <button
          className={`${toolStyles.compareBtn} ${compare ? toolStyles.compareBtnActive : ''}`}
          onClick={toggleCompare}
          aria-pressed={compare}
        >
          {compare ? 'Exit compare' : 'Compare'}
        </button>

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

        <SaveButton canvasRef={processedRef} filename="edges.png" />
      </Panel>
    </div>
  )
}
