import { useCallback, useEffect, useRef, useState } from 'react'
import { TOOL_GROUPS, TOOL_LABELS, type Tool } from '@/tools/index'
import { useIsTouch } from '@/hooks/useIsTouch'
import styles from './ToolsMenu.module.css'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

interface Props {
  activeTool: Tool
  onSelect: (tool: Tool) => void
}

export function ToolsMenu({ activeTool, onSelect }: Props) {
  const touch = useIsTouch()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  const handleSelect = useCallback((tool: Tool) => {
    onSelect(tool)
    close()
  }, [onSelect, close])

  // Close on outside click (desktop dropdown only)
  useEffect(() => {
    if (!open || touch) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, touch, close])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  // Prevent body scroll when sheet is open (touch only)
  useEffect(() => {
    if (!open || !touch) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open, touch])

  // grouped, same four families as the landing page — a flat 19 is unreadable
  const toolRows = TOOL_GROUPS.map(group => (
    <div key={group.name} className={styles.group} role="group" aria-label={group.name}>
      <span className={styles.groupLabel}>{group.name}</span>
      {group.tools.map(tool => (
        <button
          key={tool}
          id={`tool-${tool}`}
          role="option"
          aria-selected={tool === activeTool}
          className={[
            touch ? styles.toolRow : styles.toolRowDesktop,
            tool === activeTool ? styles.toolRowActive : '',
          ].filter(Boolean).join(' ')}
          onClick={() => handleSelect(tool)}
        >
          {TOOL_LABELS[tool]}
          {tool === activeTool && (
            <span className={touch ? styles.toolRowCheck : styles.toolRowCheckDesktop} aria-hidden>
              <CheckIcon />
            </span>
          )}
        </button>
      ))}
    </div>
  ))

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Switch tool — current: ${TOOL_LABELS[activeTool]}`}
      >
        {TOOL_LABELS[activeTool]}
        <svg className={styles.triggerChevron} width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
          <path d={open ? 'M1 5L5 1L9 5' : 'M1 1L5 5L9 1'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && !touch && (
        <div className={styles.dropdown} role="listbox" aria-label="Select tool" aria-activedescendant={`tool-${activeTool}`}>
          {toolRows}
        </div>
      )}

      {open && touch && (
        <>
          <div className={styles.backdrop} onClick={close} aria-hidden />
          <div className={styles.sheet} role="listbox" aria-label="Select tool" aria-activedescendant={`tool-${activeTool}`}>
            <div className={styles.grabHandle} aria-hidden />
            <div className={styles.sheetHeader}>
              <span className={styles.sheetHeaderText}>Select Tool</span>
            </div>
            <div className={styles.toolList}>
              {toolRows}
            </div>
            <div className={styles.doneRow}>
              <button className={styles.doneBtn} onClick={close}>Done</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
