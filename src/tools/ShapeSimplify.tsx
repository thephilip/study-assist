import { useState, useCallback } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { useProcessedCanvas } from '@/hooks/useProcessedCanvas'
import { applyShapeSimplify } from './shape-simplify'
import type { LoadedImage } from '@/hooks/useImage'
import styles from './Tool.module.css'

type Props = { image: LoadedImage }

export function ShapeSimplify({ image }: Props) {
  const [blurRadius, setBlurRadius] = useState(8)
  const [levels, setLevels] = useState(4)

  const processData = useCallback(
    (data: ImageData) => applyShapeSimplify(data, blurRadius, levels),
    [blurRadius, levels],
  )

  const canvasRef = useProcessedCanvas(image, processData)

  return (
    <div className={styles.root}>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <Panel className={styles.controls}>
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
