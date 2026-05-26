import { useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/Slider'
import { Panel } from '@/components/Panel'
import { useCompare } from '@/hooks/useCompare'
import { applyDither, type DitherAlgorithm, type DitherMode } from './dither'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap } from '@/components/CanvasWrap'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { downloadCanvas } from '@/lib/export'
import toolStyles from './Tool.module.css'
import styles from './Dither.module.css'

const ALGORITHMS: { value: DitherAlgorithm; label: string }[] = [
  { value: 'floyd-steinberg', label: 'Floyd-Steinberg' },
  { value: 'atkinson',        label: 'Atkinson' },
  { value: 'bayer-4',         label: 'Bayer 4×4' },
  { value: 'bayer-8',         label: 'Bayer 8×8' },
]

type Props = { image: LoadedImage; originalImage: LoadedImage; onApply: (canvas: HTMLCanvasElement) => void }

export function Dither({ image, originalImage, onApply }: Props) {
  const [algorithm, setAlgorithm] = useState<DitherAlgorithm>('floyd-steinberg')
  const [mode, setMode] = useState<DitherMode>('grayscale')
  const [levels, setLevels] = useState(2)

  const processData = useCallback(
    (data: ImageData) => applyDither(data, algorithm, mode, levels),
    [algorithm, mode, levels],
  )

  const { processedRef, originalRef, compare, toggleCompare } = useCompare(image, processData, originalImage)

  useRegisterToolActions('Dither', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-png', label: 'Save PNG', handler: () => { const c = processedRef.current; if (c) downloadCanvas(c, 'dither.png') } },
    { id: 'use-as-source', label: 'Use as source', handler: () => { const c = processedRef.current; if (c) onApply(c) } },
  ], [compare, toggleCompare, processedRef, onApply]))

  return (
    <div className={toolStyles.root}>
      <CanvasWrap compare={compare}>
        <canvas ref={originalRef} className={`${toolStyles.canvas} ${!compare ? toolStyles.hidden : ''}`} role="img" aria-label="Original image" />
        <canvas ref={processedRef} className={toolStyles.canvas} role="img" aria-label="Dithered image" />
      </CanvasWrap>

      <Panel className={toolStyles.controls}>
        <h2 className={toolStyles.toolName}>Dither</h2>
        <p className={toolStyles.description}>
          Quantizes tones using error-diffusion or ordered patterns — useful for studying flat value shapes and silhouettes.
        </p>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Algorithm</span>
          <div className={styles.algoGrid}>
            {ALGORITHMS.map(a => (
              <button
                key={a.value}
                className={`${styles.algoBtn} ${algorithm === a.value ? styles.algoBtnActive : ''}`}
                onClick={() => setAlgorithm(a.value)}
                aria-pressed={algorithm === a.value}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Mode</span>
          <div className={styles.toggle}>
            {(['grayscale', 'color'] as DitherMode[]).map(m => (
              <button
                key={m}
                className={`${styles.toggleBtn} ${mode === m ? styles.toggleBtnActive : ''}`}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
              >
                {m === 'grayscale' ? 'Greyscale' : 'Colour'}
              </button>
            ))}
          </div>
        </div>

        <Slider
          label="Levels"
          value={levels}
          min={2}
          max={8}
          onChange={setLevels}
        />

      </Panel>
    </div>
  )
}
