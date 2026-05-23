import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import styles from './ImageDrop.module.css'

type Props = {
  onFile: (file: File) => void
}

export function ImageDrop({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) onFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.over : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Drop an image here or click to browse"
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.input}
        onChange={handleChange}
        tabIndex={-1}
        aria-hidden
      />
      <div className={styles.label}>
        <span className={styles.icon}>⬆</span>
        <span>Drop a reference image here</span>
        <span className={styles.sub}>JPEG · PNG · WebP</span>
      </div>
    </div>
  )
}
