import { useEffect, useRef } from 'react'
import styles from './UpgradeModal.module.css'

interface Props {
  title: string
  body: string
  onClose: () => void
}

export function UpgradeModal({ title, body, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
  }, [])

  function close() {
    dialogRef.current?.close()
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) close()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleBackdropClick}
      onClose={onClose}
      aria-labelledby="upgrade-modal-title"
    >
      <div className={styles.panel}>
        <p className={styles.title} id="upgrade-modal-title">{title}</p>
        <p className={styles.body}>{body}</p>
        <button type="button" className={styles.closeBtn} onClick={close}>
          Got it
        </button>
      </div>
    </dialog>
  )
}
