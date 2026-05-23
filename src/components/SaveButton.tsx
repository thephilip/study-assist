import type { RefObject } from 'react'
import { downloadCanvas } from '@/lib/export'
import styles from './SaveButton.module.css'

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  filename: string
}

export function SaveButton({ canvasRef, filename }: Props) {
  return (
    <button
      className={styles.btn}
      onClick={() => {
        const canvas = canvasRef.current
        if (canvas) downloadCanvas(canvas, filename)
      }}
    >
      Save PNG
    </button>
  )
}
