import { useState, useCallback } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { SaveButton } from '@/components/SaveButton'
import { ApplyButton } from '@/components/ApplyButton'
import { useCompare } from '@/hooks/useCompare'
import { applyShapeSimplify } from './shape-simplify'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import styles from './Tool.module.css'

type Props = { image: LoadedImage; onApply: (canvas: HTMLCanvasElement) => void }

export function ShapeSimplify({ image, onApply }: Props) {
  const [blurRadius, setBlurRadius] = useState(8)
  const [levels, setLevels] = useState(4)

  const processData = useCallback(
    (data: ImageData) => applyShapeSimplify(data, blurRadius, levels),
    [blurRadius, levels],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData)

  return (
    <div className={styles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${styles.canvas} ${!compare ? styles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={styles.canvas} role="img" aria-label="Simplified shapes" />
      </CanvasWrap>
      <Panel className={styles.controls}>
        <h2 className={styles.toolName}>Shape Simplify</h2>
        <p className={styles.description}>
          Blur flattens texture; posterize snaps colours to flat planes. Together they reveal the big shapes of the composition.
        </p>
        <button
          className={`${styles.compareBtn} ${compare ? styles.compareBtnActive : ''}`}
          onClick={toggleCompare}
          aria-pressed={compare}
        >
          {compare ? 'Exit compare' : 'Compare'}
        </button>
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
        <SaveButton canvasRef={processedRef} filename="shape-simplify.png" />
        <ApplyButton canvasRef={processedRef} onApply={onApply} />
      </Panel>
    </div>
  )
}
