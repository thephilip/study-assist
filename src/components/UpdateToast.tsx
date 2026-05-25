import styles from './UpdateToast.module.css'

interface Props {
  confirming?: boolean
  onUpdate: () => void
  onConfirm: () => void
  onCancelConfirm: () => void
  onDismiss: () => void
}

export function UpdateToast({ confirming, onUpdate, onConfirm, onCancelConfirm, onDismiss }: Props) {
  if (confirming) {
    return (
      <div className={styles.toast} role="alertdialog" aria-live="assertive">
        <span className={styles.message}>Your current image will be lost.</span>
        <button type="button" className={styles.updateBtn} onClick={onConfirm}>
          Reload anyway
        </button>
        <button type="button" className={styles.dismissBtn} onClick={onCancelConfirm} aria-label="Cancel">
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.message}>A new version is available.</span>
      <button type="button" className={styles.updateBtn} onClick={onUpdate}>
        Reload
      </button>
      <button type="button" className={styles.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}
