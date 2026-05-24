import { useState, useCallback } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { SaveButton } from '@/components/SaveButton'
import { useCompare } from '@/hooks/useCompare'
import { applyValueMap } from './value-map'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import styles from './Tool.module.css'

type Props = { image: LoadedImage }

export function ValueMap({ image }: Props) {
  const [levels, setLevels] = useState(4)

  const processData = useCallback(
    (data: ImageData) => applyValueMap(data, levels),
    [levels],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData)

  return (
    <div className={styles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${styles.canvas} ${!compare ? styles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={styles.canvas} role="img" aria-label="Value map" />
      </CanvasWrap>
      <Panel className={styles.controls}>
        <h2 className={styles.toolName}>Value Map</h2>
        <p className={styles.description}>
          Posterizes the image to a fixed number of tonal levels to reveal value structure.
        </p>
        <button
          className={`${styles.compareBtn} ${compare ? styles.compareBtnActive : ''}`}
          onClick={toggleCompare}
          aria-pressed={compare}
        >
          {compare ? 'Exit compare' : 'Compare'}
        </button>
        <Slider
          label="Levels"
          value={levels}
          min={2}
          max={8}
          onChange={setLevels}
        />
        <SaveButton canvasRef={processedRef} filename="value-map.png" />
        <div className={styles.swatches}>
          {Array.from({ length: levels }, (_, i) => {
            const v = Math.round((i / (levels - 1)) * 255)
            return (
              <div
                key={i}
                className={styles.swatch}
                style={{ background: `rgb(${v},${v},${v})` }}
                title={`Value ${Math.round((v / 255) * 100)}%`}
              />
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
