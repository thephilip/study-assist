import { useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { useCompare } from '@/hooks/useCompare'
import { applyNotan } from './notan'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { downloadCanvas } from '@/lib/export'
import styles from './Tool.module.css'

type Props = { image: LoadedImage; originalImage: LoadedImage; onApply: (canvas: HTMLCanvasElement) => void }

export function Notan({ image, originalImage, onApply }: Props) {
  const [threshold, setThreshold] = useState(128)

  const processData = useCallback(
    (data: ImageData) => applyNotan(data, threshold),
    [threshold],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData, originalImage)

  useRegisterToolActions('Notan', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-png', label: 'Save PNG', handler: () => { const c = processedRef.current; if (c) downloadCanvas(c, 'notan.png') } },
    { id: 'use-as-source', label: 'Use as source', handler: () => { const c = processedRef.current; if (c) onApply(c) } },
  ], [compare, toggleCompare, processedRef, onApply]))

  return (
    <div className={styles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${styles.canvas} ${!compare ? styles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={styles.canvas} role="img" aria-label="Notan" />
      </CanvasWrap>
      <Panel className={styles.controls} toolSlug="notan">
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
