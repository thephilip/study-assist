import { useState, useEffect, useCallback, type ReactNode } from 'react'
import styles from './Panel.module.css'

type Props = {
  children: ReactNode
  className?: string
  /** When set, the panel becomes collapsible with per-tool localStorage persistence */
  toolSlug?: string
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 200ms ease',
      }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function Panel({ children, className, toolSlug }: Props) {
  const storageKey = toolSlug ? `panelCollapsed_${toolSlug}` : null

  const [collapsed, setCollapsed] = useState(() => {
    if (storageKey) {
      try {
        return localStorage.getItem(storageKey) === 'true'
      } catch { /* localStorage unavailable */ }
    }
    return false
  })

  // Persist to localStorage
  useEffect(() => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, String(collapsed)) } catch { /* noop */ }
    }
  }, [collapsed, storageKey])

  const handleToggle = useCallback(() => {
    setCollapsed(c => !c)
  }, [])

  if (toolSlug) {
    return (
      <div
        className={`${styles.panel} ${className ?? ''} ${collapsed ? styles.collapsed : ''}`}
        data-collapsed={collapsed || undefined}
      >
        <button
          className={`${styles.chevron} ${collapsed ? styles.chevronCollapsed : ''}`}
          onClick={handleToggle}
          aria-label={collapsed ? 'Expand controls panel' : 'Collapse controls panel'}
          title={collapsed ? 'Expand controls panel' : 'Collapse controls panel'}
          type="button"
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.panel} ${className ?? ''}`}>
      {children}
    </div>
  )
}
