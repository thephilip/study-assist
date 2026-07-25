import { useRef, useState, type DragEvent, type ChangeEvent, type MouseEvent } from 'react'
import styles from './ImageDrop.module.css'

type Props = {
  onFile: (file: File) => void
}

export function ImageDrop({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const browse = () => inputRef.current?.click()

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
      // the button carries the semantics; clicking the surrounding zone is a convenience
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (!(e.target as HTMLElement).closest('button')) browse()
      }}
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
        <button type="button" className={styles.cta} onClick={browse}>Add an image</button>
        <span className={styles.sub}>or drop a photo here · paste from the clipboard</span>
        <span className={styles.formats}>JPEG · PNG · WebP</span>
      </div>
    </div>
  )
}
