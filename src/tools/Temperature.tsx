import { useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { useCompare } from '@/hooks/useCompare'
import { applyTemperature } from './temperature'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { downloadCanvas } from '@/lib/export'
import styles from './Tool.module.css'

type Props = { image: LoadedImage; originalImage: LoadedImage; onApply: (canvas: HTMLCanvasElement) => void }

export function Temperature({ image, originalImage, onApply }: Props) {
  const [intensity, setIntensity] = useState(80)
  const [blend, setBlend] = useState(100)

  const processData = useCallback(
    (data: ImageData) => applyTemperature(data, intensity / 100, blend / 100),
    [intensity, blend],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData, originalImage)

  useRegisterToolActions('Temperature Map', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-png', label: 'Save PNG', handler: () => { const c = processedRef.current; if (c) downloadCanvas(c, 'temperature-map.png') } },
    { id: 'use-as-source', label: 'Use as source', handler: () => { const c = processedRef.current; if (c) onApply(c) } },
  ], [compare, toggleCompare, processedRef, onApply]))

  return (
    <div className={styles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${styles.canvas} ${!compare ? styles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={styles.canvas} role="img" aria-label="Temperature map" />
      </CanvasWrap>
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
      </Panel>
    </div>
  )
}
