import styles from './UpdateToast.module.css'

interface Props {
  onUpdate: () => void
  onDismiss: () => void
}

export function UpdateToast({ onUpdate, onDismiss }: Props) {
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.message}>A new version is available.</span>
      <button className={styles.updateBtn} onClick={onUpdate}>
        Reload
      </button>
      <button className={styles.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}
