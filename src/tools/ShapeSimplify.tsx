import { useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { useCompare } from '@/hooks/useCompare'
import { applyShapeSimplify } from './shape-simplify'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { downloadCanvas } from '@/lib/export'
import styles from './Tool.module.css'

type Props = { image: LoadedImage; originalImage: LoadedImage; onApply: (canvas: HTMLCanvasElement) => void }

export function ShapeSimplify({ image, originalImage, onApply }: Props) {
  const [blurRadius, setBlurRadius] = useState(8)
  const [levels, setLevels] = useState(4)

  const processData = useCallback(
    (data: ImageData) => applyShapeSimplify(data, blurRadius, levels),
    [blurRadius, levels],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData, originalImage)

  useRegisterToolActions('Shape Simplify', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-png', label: 'Save PNG', handler: () => { const c = processedRef.current; if (c) downloadCanvas(c, 'shape-simplify.png') } },
    { id: 'use-as-source', label: 'Use as source', handler: () => { const c = processedRef.current; if (c) onApply(c) } },
  ], [compare, toggleCompare, processedRef, onApply]))

  return (
    <div className={styles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${styles.canvas} ${!compare ? styles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={styles.canvas} role="img" aria-label="Simplified shapes" />
      </CanvasWrap>
      <Panel className={styles.controls} toolSlug="shape-simplify">
        <h2 className={styles.toolName}>Shape Simplify</h2>
        <p className={styles.description}>
          Blur flattens texture; posterize snaps colours to flat planes. Together they reveal the big shapes of the composition.
        </p>
        <Slider
          label="Blur radius"
          value={blurRadius}
          min={1}
          max={40}
          onChange={setBlurRadius}
        />
        <Slider
          label="Colour levels"
          value={levels}
          min={2}
          max={10}
          onChange={setLevels}
        />
      </Panel>
    </div>
  )
}
