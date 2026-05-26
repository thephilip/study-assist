import { useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { useCompare } from '@/hooks/useCompare'
import { applyAutomatedSketch, type SketchEdgeColor } from './automated-sketch'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { downloadCanvas } from '@/lib/export'
import toolStyles from './Tool.module.css'
import styles from './AutomatedSketch.module.css'

type Props = { image: LoadedImage; originalImage: LoadedImage; onApply: (canvas: HTMLCanvasElement) => void }

export function AutomatedSketch({ image, originalImage, onApply }: Props) {
  const [blurRadius, setBlurRadius] = useState(8)
  const [levels, setLevels] = useState(4)
  const [edgeBlur, setEdgeBlur] = useState(1)
  const [threshold, setThreshold] = useState(20)
  const [edgeOpacity, setEdgeOpacity] = useState(80)
  const [edgeColor, setEdgeColor] = useState<SketchEdgeColor>('light')

  const processData = useCallback(
    (data: ImageData) => applyAutomatedSketch(data, blurRadius, levels, edgeBlur, threshold, edgeOpacity / 100, edgeColor),
    [blurRadius, levels, edgeBlur, threshold, edgeOpacity, edgeColor],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData, originalImage)

  useRegisterToolActions('Automated Sketch', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-png', label: 'Save PNG', handler: () => { const c = processedRef.current; if (c) downloadCanvas(c, 'automated-sketch.png') } },
    { id: 'use-as-source', label: 'Use as source', handler: () => { const c = processedRef.current; if (c) onApply(c) } },
  ], [compare, toggleCompare, processedRef, onApply]))

  return (
    <div className={toolStyles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${toolStyles.canvas} ${!compare ? toolStyles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={toolStyles.canvas} role="img" aria-label="Automated sketch" />
      </CanvasWrap>

      <Panel className={toolStyles.controls}>
        <h2 className={toolStyles.toolName}>Automated Sketch</h2>
        <p className={toolStyles.description}>
          Composites edge-detection linework over simplified colour planes — produces a hand-drawn sketch look from any reference.
        </p>

        <Slider label="Colour blur" value={blurRadius} min={1} max={40} onChange={setBlurRadius} />
        <Slider label="Colour levels" value={levels} min={2} max={10} onChange={setLevels} />
        <Slider label="Edge blur" value={edgeBlur} min={0} max={10} onChange={setEdgeBlur} />
        <Slider label="Edge strength" value={threshold} min={1} max={100} onChange={setThreshold} />
        <Slider label="Edge opacity" value={edgeOpacity} min={10} max={100} onChange={setEdgeOpacity} />

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Line colour</span>
          <div className={styles.toggle}>
            {(['light', 'dark'] as SketchEdgeColor[]).map(c => (
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
