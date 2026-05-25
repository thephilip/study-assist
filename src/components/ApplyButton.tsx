import type { RefObject } from 'react'
import styles from './ApplyButton.module.css'

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onApply: (canvas: HTMLCanvasElement) => void
}

export function ApplyButton({ canvasRef, onApply }: Props) {
  return (
    <button
      className={styles.btn}
      onClick={() => {
        const canvas = canvasRef.current
        if (canvas) onApply(canvas)
      }}
    >
      Use as source
    </button>
  )
}
