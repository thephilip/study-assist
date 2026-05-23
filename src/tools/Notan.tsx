import { useState, useCallback } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { useProcessedCanvas } from '@/hooks/useProcessedCanvas'
import { applyNotan } from './notan'
import type { LoadedImage } from '@/hooks/useImage'
import styles from './Tool.module.css'

type Props = { image: LoadedImage }

export function Notan({ image }: Props) {
  const [threshold, setThreshold] = useState(128)

  const processData = useCallback(
    (data: ImageData) => applyNotan(data, threshold),
    [threshold],
  )

  const canvasRef = useProcessedCanvas(image, processData)

  return (
    <div className={styles.root}>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <Panel className={styles.controls}>
        <h2 className={styles.toolName}>Notan</h2>
        <p className={styles.description}>
          Reduces the image to two tones — dark and light — to study shape and silhouette.
        </p>
        <Slider
          label="Threshold"
          value={threshold}
          min={1}
          max={254}
          onChange={setThreshold}
        />
      </Panel>
    </div>
  )
}
