import React, { useState, useEffect, Children, cloneElement, isValidElement, type ReactNode, type CSSProperties } from 'react'
import styles from './Panel.module.css'

type Props = {
  children: ReactNode
  className?: string
  /** When set, the panel becomes collapsible with per-tool localStorage persistence */
  toolSlug?: string
}

function ChevronIcon() {
  return (
    <svg
      className={styles.chevronIcon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function withStaggerIndex(children: ReactNode) {
  return Children.map(children, (child, i) => {
    if (!isValidElement(child)) return child
    const el = child as React.ReactElement<{ style?: CSSProperties }>
    return cloneElement(el, { style: { '--stagger-i': i, ...(el.props.style ?? {}) } as CSSProperties })
  })
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

  const [expandKey, setExpandKey] = useState(0)

  // Persist to localStorage
  useEffect(() => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, String(collapsed)) } catch { /* no-op */ }
    }
  }, [collapsed, storageKey])

  function handleToggle() {
    if (collapsed) setExpandKey(k => k + 1)
    setCollapsed(c => !c)
  }

  // ── Collapsible panel ───────────────────────────────────────────────────
  // The chevron is rendered OUTSIDE the scrollable panel so it's never
  // clipped by overflow-y: auto. A wrapper div carries the .controls class
  // (width, border, flex layout) while the inner panel handles scrolling.
  if (toolSlug) {
    return (
      <div className={`${styles.wrapper} ${className ?? ''}`} data-collapsed={collapsed || undefined}>
        <div className={`${styles.scrollArea} ${collapsed ? styles.scrollAreaCollapsed : ''}`}>
          <div key={expandKey} className={`${styles.content} staggerFadeIn`} inert={collapsed ? true : undefined}>
            {withStaggerIndex(children)}
          </div>
        </div>
        <button
          className={styles.chevron}
          onClick={handleToggle}
          aria-label={collapsed ? 'Expand controls panel' : 'Collapse controls panel'}
          title={collapsed ? 'Expand controls panel' : 'Collapse controls panel'}
          type="button"
        >
          <ChevronIcon />
        </button>
      </div>
    )
  }

  // ── Non-collapsible panel ──────────────────────────────────────────────
  // Exactly the same DOM structure as before: children go directly into .panel
  return (
    <div className={`${styles.panel} staggerFadeIn ${className ?? ''}`}>
      {withStaggerIndex(children)}
    </div>
  )
}
