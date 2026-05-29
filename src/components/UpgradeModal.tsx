import { useEffect, useRef, useState } from 'react'
import { redeemCode } from '@/lib/entitlements'
import styles from './UpgradeModal.module.css'

interface Props {
  title: string
  body: string
  onClose: () => void
  /** Called immediately after a valid code is redeemed, before the dialog closes. */
  onUnlock?: () => void
}

export function UpgradeModal({ title, body, onClose, onUnlock }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [codeOpen, setCodeOpen] = useState(false)
  const [codeValue, setCodeValue] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [redeemed, setRedeemed] = useState(false)

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

  function handleRedeem() {
    if (redeemCode(codeValue)) {
      setRedeemed(true)
      onUnlock?.()
      setTimeout(() => close(), 900)
    } else {
      setCodeError(true)
    }
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

        {onUnlock && (
          <div className={styles.codeSection}>
            {!codeOpen && !redeemed && (
              <button type="button" className={styles.codeToggle} onClick={() => setCodeOpen(true)}>
                Have a code?
              </button>
            )}
            {codeOpen && !redeemed && (
              <div className={styles.codeForm}>
                <input
                  className={`${styles.codeInput}${codeError ? ` ${styles.codeInputError}` : ''}`}
                  type="text"
                  placeholder="Enter code"
                  value={codeValue}
                  onChange={e => { setCodeValue(e.target.value); setCodeError(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <button type="button" className={styles.redeemBtn} onClick={handleRedeem}>
                  Redeem
                </button>
                {codeError && <p className={styles.codeError}>Invalid code</p>}
              </div>
            )}
            {redeemed && (
              <p className={styles.codeSuccess}>✓ All features unlocked</p>
            )}
          </div>
        )}
      </div>
    </dialog>
  )
}
