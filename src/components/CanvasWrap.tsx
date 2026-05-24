import { useRef, useCallback, useEffect, useState } from 'react'
import toolStyles from '@/tools/Tool.module.css'
import styles from './CanvasWrap.module.css'

interface Props {
  children: React.ReactNode
  compare?: boolean
  style?: React.CSSProperties
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  )
}

export function CanvasWrap({ children, compare, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen?.()
    }
  }, [])

  const wrapClass = [
    toolStyles.canvasWrap,
    compare ? toolStyles.compareActive : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={ref}
      className={wrapClass}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <button
        className={`${styles.fullscreenBtn} ${hovered || isFullscreen ? styles.visible : ''}`}
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit full screen' : 'View full screen'}
        title={isFullscreen ? 'Exit full screen' : 'View full screen'}
      >
        {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
      </button>
    </div>
  )
}
