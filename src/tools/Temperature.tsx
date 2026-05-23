import { useState, useCallback } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { SaveButton } from '@/components/SaveButton'
import { useProcessedCanvas } from '@/hooks/useProcessedCanvas'
import { applyTemperature } from './temperature'
import type { LoadedImage } from '@/hooks/useImage'
import styles from './Tool.module.css'

type Props = { image: LoadedImage }

export function Temperature({ image }: Props) {
  const [intensity, setIntensity] = useState(80)
  const [blend, setBlend] = useState(100)

  const processData = useCallback(
    (data: ImageData) => applyTemperature(data, intensity / 100, blend / 100),
    [intensity, blend],
  )

  const canvasRef = useProcessedCanvas(image, processData)

  return (
    <div className={styles.root}>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <Panel className={styles.controls}>
        <h2 className={styles.toolName}>Temperature Map</h2>
        <p className={styles.description}>
          Maps each pixel's hue to warm (orange) or cool (blue), preserving
          luminance so value structure remains readable.
        </p>
        <Slider
          label="Intensity"
          value={intensity}
          min={0}
          max={100}
          onChange={setIntensity}
        />
        <Slider
          label="Blend"
          value={blend}
          min={0}
          max={100}
          onChange={setBlend}
        />
        <div className={styles.swatches}>
          <div
            className={styles.swatch}
            style={{ background: 'hsl(30 90% 55%)', width: 40 }}
            title="Warm"
          />
          <div
            className={styles.swatch}
            style={{ background: 'hsl(210 80% 55%)', width: 40 }}
            title="Cool"
          />
        </div>
        <p className={styles.description}>
          Warm &nbsp;·&nbsp; Cool
        </p>
        <SaveButton canvasRef={canvasRef} filename="temperature-map.png" />
      </Panel>
    </div>
  )
}
