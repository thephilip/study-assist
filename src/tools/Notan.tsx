import { useState, useCallback } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { SaveButton } from '@/components/SaveButton'
import { useCompare } from '@/hooks/useCompare'
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

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData)

  return (
    <div className={styles.root}>
      <div className={`${styles.canvasWrap} ${compare ? styles.compareActive : ''}`}>
        <canvas ref={originalRef} className={`${styles.canvas} ${!compare ? styles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={styles.canvas} role="img" aria-label="Notan" />
      </div>
      <Panel className={styles.controls}>
        <h2 className={styles.toolName}>Notan</h2>
        <p className={styles.description}>
          Reduces the image to two tones — dark and light — to study shape and silhouette.
        </p>
        <button
          className={`${styles.compareBtn} ${compare ? styles.compareBtnActive : ''}`}
          onClick={toggleCompare}
          aria-pressed={compare}
        >
          {compare ? 'Exit compare' : 'Compare'}
        </button>
        <Slider
          label="Threshold"
          value={threshold}
          min={1}
          max={254}
          onChange={setThreshold}
        />
        <SaveButton canvasRef={processedRef} filename="notan.png" />
      </Panel>
    </div>
  )
}
