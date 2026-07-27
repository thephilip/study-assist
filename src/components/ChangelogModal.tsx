import { useEffect, useRef } from 'react'
import { CHANGELOG } from '@/lib/changelog'
import { useDismissOnBack } from '@/hooks/useDismissOnBack'
import styles from './ChangelogModal.module.css'

interface Props {
  onDismiss: () => void
}

export function ChangelogModal({ onDismiss }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
  }, [])

  function close() {
    dialogRef.current?.close()
  }

  useDismissOnBack(true, close)

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) close()
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClick={handleBackdropClick} onClose={onDismiss}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>What's new</h2>
          <button type="button" className={styles.closeBtn} onClick={close} aria-label="Close">✕</button>
        </div>

        <div className={styles.releases}>
          {CHANGELOG.map(release => {
            const publicEntries = release.entries.filter(e => e.visibility === 'public')
            const hasHidden = release.entries.some(e => e.visibility === 'hidden')

            return (
              <div key={release.version} className={styles.release}>
                <div className={styles.releaseHeader}>
                  <span className={styles.version}>v{release.version}</span>
                  <span className={styles.date}>{release.date}</span>
                </div>
                <ul className={styles.entries}>
                  {publicEntries.map((entry, i) => (
                    <li key={i} className={styles.entry}>{entry.text}</li>
                  ))}
                  {hasHidden && (
                    <li className={styles.entry}>Bug fixes and improvements</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>

        <button type="button" className={styles.dismissBtn} onClick={close}>Got it</button>
      </div>
    </dialog>
  )
}
