import { useCallback, useEffect, useState } from 'react'
import { TOOLS, TOOL_LABELS, type Tool } from '@/tools/index'
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

  const close = useCallback(() => setOpen(false), [])

  const handleSelect = useCallback((tool: Tool) => {
    onSelect(tool)
    close()
  }, [onSelect, close])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!touch) return null

  return (
    <>
      <button
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Switch tool, current: ${TOOL_LABELS[activeTool]}`}
      >
        <span>Tool:</span>
        <span className={styles.triggerLabel}>{TOOL_LABELS[activeTool]}</span>
        <svg className={styles.triggerChevron} width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={close} aria-hidden />
          <div className={styles.sheet} role="listbox" aria-label="Select tool" aria-activedescendant={`tool-${activeTool}`}>
            <div className={styles.grabHandle} aria-hidden />
            <div className={styles.sheetHeader}>
              <span className={styles.sheetHeaderText}>Select Tool</span>
            </div>
            <div className={styles.toolList}>
              {TOOLS.map(tool => (
                <button
                  key={tool}
                  id={`tool-${tool}`}
                  role="option"
                  aria-selected={tool === activeTool}
                  className={[styles.toolRow, tool === activeTool ? styles.toolRowActive : ''].filter(Boolean).join(' ')}
                  onClick={() => handleSelect(tool)}
                >
                  {TOOL_LABELS[tool]}
                  {tool === activeTool && (
                    <span className={styles.toolRowCheck} aria-hidden>
                      <CheckIcon />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className={styles.doneRow}>
              <button className={styles.doneBtn} onClick={close}>Done</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
