import { useCallback, useEffect, useRef, useState } from 'react'
import { useActionsContext, type ToolAction } from '@/context/ActionsContext'
import { useIsTouch } from '@/hooks/useIsTouch'
import styles from './ActionsMenu.module.css'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ActionRow({
  action,
  onClose,
  touch,
}: {
  action: ToolAction
  onClose: () => void
  touch: boolean
}) {
  const handleClick = useCallback(() => {
    action.handler()
    onClose()
  }, [action, onClose])

  return (
    <button
      role="menuitem"
      className={[
        styles.row,
        touch ? styles.rowTouch : '',
        action.checked ? styles.rowActive : '',
        action.danger ? styles.rowDanger : '',
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      disabled={action.disabled}
    >
      <span className={styles.rowLabel}>{action.label}</span>
      {action.checked !== undefined && (
        <span className={styles.check} aria-hidden>
          {action.checked && <CheckIcon />}
        </span>
      )}
    </button>
  )
}

function MenuContent({
  onClose,
  touch,
}: {
  onClose: () => void
  touch: boolean
}) {
  const { globalActions, contextualActions, activeToolName } = useActionsContext()
  const hasGlobal = globalActions.length > 0
  const hasContextual = contextualActions.length > 0
  const hasBoth = hasGlobal && hasContextual
  const hasAny = hasGlobal || hasContextual

  return (
    <>
      <div className={[styles.menuHeader, touch ? styles.menuHeaderTouch : ''].filter(Boolean).join(' ')}>
        <span className={styles.headerPrefix}>Actions</span>
        {activeToolName && <span className={styles.headerTool}>: {activeToolName}</span>}
      </div>

      {!hasAny && <p className={styles.empty}>No actions available</p>}

      {hasGlobal && globalActions.map(action => (
        <ActionRow key={action.id} action={action} onClose={onClose} touch={touch} />
      ))}

      {hasBoth && (
        <div className={[styles.divider, touch ? styles.dividerTouch : ''].filter(Boolean).join(' ')} aria-hidden />
      )}

      {hasContextual && (
        <>
          {hasBoth && (
            <div className={[styles.sectionLabel, touch ? styles.sectionLabelTouch : ''].filter(Boolean).join(' ')}>
              {activeToolName}
            </div>
          )}
          {contextualActions.map(action => (
            <ActionRow key={action.id} action={action} onClose={onClose} touch={touch} />
          ))}
        </>
      )}
    </>
  )
}

export function ActionsMenu() {
  const { contextualActions } = useActionsContext()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touch = useIsTouch()
  const hasBadge = contextualActions.length > 0

  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen(o => !o), [])

  // Close on outside click (desktop dropdown only)
  useEffect(() => {
    if (!open || touch) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, touch])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Prevent body scroll when sheet is open on touch
  useEffect(() => {
    if (!open || !touch) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open, touch])

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={[styles.trigger, open ? styles.triggerOpen : ''].filter(Boolean).join(' ')}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions${hasBadge ? ', tool actions available' : ''}`}
      >
        Actions
        <svg
          className={styles.triggerChevron}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden
        >
          <path
            d={open ? 'M1 5L5 1L9 5' : 'M1 1L5 5L9 1'}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {hasBadge && <span className={styles.badge} aria-hidden />}
      </button>

      {open && !touch && (
        <div className={styles.dropdown} role="menu" aria-label="Actions">
          <MenuContent onClose={close} touch={false} />
        </div>
      )}

      {open && touch && (
        <>
          <div className={styles.backdrop} onClick={close} aria-hidden />
          <div className={styles.sheet} role="menu" aria-label="Actions">
            <div className={styles.grabHandle} aria-hidden />
            <MenuContent onClose={close} touch />
            <div className={styles.doneRow}>
              <button className={styles.doneBtn} onClick={close}>Done</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
