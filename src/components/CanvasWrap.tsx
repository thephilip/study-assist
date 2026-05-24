import { useRef, useCallback, useEffect, useState, useReducer, createContext, useContext } from 'react'
import toolStyles from '@/tools/Tool.module.css'
import styles from './CanvasWrap.module.css'

// ── Zoom state ────────────────────────────────────────────────────────────────

type Xform = { scale: number; x: number; y: number }
type XformAction =
  | { type: 'wheel'; cx: number; cy: number; factor: number }
  | { type: 'pinch'; newMx: number; newMy: number; lastMx: number; lastMy: number; distFactor: number }
  | { type: 'reset' }

const INIT: Xform = { scale: 1, x: 0, y: 0 }

function xformReducer(state: Xform, action: XformAction): Xform {
  switch (action.type) {
    case 'wheel': {
      const newScale = Math.min(8, Math.max(1, state.scale * action.factor))
      if (newScale === state.scale) return state
      if (newScale === 1) return INIT
      const f = newScale / state.scale
      return { scale: newScale, x: action.cx - (action.cx - state.x) * f, y: action.cy - (action.cy - state.y) * f }
    }
    case 'pinch': {
      const newScale = Math.min(8, Math.max(1, state.scale * action.distFactor))
      if (newScale === 1) return INIT
      const f = newScale / state.scale
      return { scale: newScale, x: action.newMx - (action.lastMx - state.x) * f, y: action.newMy - (action.lastMy - state.y) * f }
    }
    case 'reset': return INIT
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const ZoomContext = createContext<{ scale: number }>({ scale: 1 })
export const useZoom = () => useContext(ZoomContext)

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode
  compare?: boolean
  style?: React.CSSProperties
}

export function CanvasWrap({ children, compare, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const doc = document as unknown as Record<string, unknown>
  const hasNativeFullscreen = !!(document.fullscreenEnabled || doc.webkitFullscreenEnabled)
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)
  const [isCssFullscreen, setIsCssFullscreen] = useState(false)
  const isFullscreen = isNativeFullscreen || isCssFullscreen
  const [hovered, setHovered] = useState(false)
  const [xform, dispatch] = useReducer(xformReducer, INIT)

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastTapRef = useRef(0)
  const compareRef = useRef(!!compare)
  useEffect(() => { compareRef.current = !!compare }, [compare])

  // Reset zoom when switching compare mode
  useEffect(() => {
    dispatch({ type: 'reset' })
  }, [compare])

  // Native fullscreen change listener
  useEffect(() => {
    const handler = () => setIsNativeFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Non-passive wheel handler for zoom
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (compareRef.current) return
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      dispatch({ type: 'wheel', cx, cy, factor })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Pointer capture (capture phase) for pinch + double-tap
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onDown = (e: PointerEvent) => {
      const ptrs = pointersRef.current
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (e.pointerType === 'touch' && ptrs.size === 1) {
        const now = Date.now()
        if (now - lastTapRef.current < 300) dispatch({ type: 'reset' })
        lastTapRef.current = now
      }

      if (ptrs.size >= 2) e.stopPropagation()
    }

    const onMove = (e: PointerEvent) => {
      const ptrs = pointersRef.current
      if (!ptrs.has(e.pointerId)) return

      if (ptrs.size >= 2) {
        e.stopPropagation()
        if (compareRef.current) return

        const prev = ptrs.get(e.pointerId)!
        const otherEntry = [...ptrs.entries()].find(([id]) => id !== e.pointerId)
        if (!otherEntry) return
        const other = otherEntry[1]

        const lastMx = (prev.x + other.x) / 2
        const lastMy = (prev.y + other.y) / 2
        const lastDist = Math.hypot(prev.x - other.x, prev.y - other.y)

        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })

        const newMx = (e.clientX + other.x) / 2
        const newMy = (e.clientY + other.y) / 2
        const newDist = Math.hypot(e.clientX - other.x, e.clientY - other.y)

        if (lastDist > 0 && ref.current) {
          const rect = ref.current.getBoundingClientRect()
          dispatch({
            type: 'pinch',
            newMx: newMx - rect.left,
            newMy: newMy - rect.top,
            lastMx: lastMx - rect.left,
            lastMy: lastMy - rect.top,
            distFactor: newDist / lastDist,
          })
        }
      } else {
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }
    }

    const onUp = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId)
    }

    el.addEventListener('pointerdown', onDown, { capture: true })
    el.addEventListener('pointermove', onMove, { capture: true })
    el.addEventListener('pointerup', onUp, { capture: true })
    el.addEventListener('pointercancel', onUp, { capture: true })
    return () => {
      el.removeEventListener('pointerdown', onDown, { capture: true })
      el.removeEventListener('pointermove', onMove, { capture: true })
      el.removeEventListener('pointerup', onUp, { capture: true })
      el.removeEventListener('pointercancel', onUp, { capture: true })
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (hasNativeFullscreen) {
      const elAny = el as unknown as Record<string, unknown>
      if (document.fullscreenElement || doc.webkitFullscreenElement) {
        ;(doc.webkitExitFullscreen as (() => void) | undefined)?.() ?? document.exitFullscreen()
      } else {
        ;(elAny.webkitRequestFullscreen as (() => void) | undefined)?.() ?? el.requestFullscreen?.()
      }
    } else {
      setIsCssFullscreen(f => !f)
    }
  }, [hasNativeFullscreen]) // eslint-disable-line react-hooks/exhaustive-deps

  const wrapClass = [
    toolStyles.canvasWrap,
    compare ? toolStyles.compareActive : '',
    isCssFullscreen ? styles.cssFullscreen : '',
  ].filter(Boolean).join(' ')

  const { scale, x, y } = xform
  const transformStr = scale === 1 ? undefined : `translate(${x}px, ${y}px) scale(${scale})`

  return (
    <ZoomContext.Provider value={{ scale }}>
      <div
        ref={ref}
        className={wrapClass}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={compare ? {
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-4)',
            alignItems: 'center',
            padding: 'var(--space-4)',
          } : {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transformOrigin: '0 0',
            transform: transformStr,
          }}
        >
          {children}
        </div>
        <button
          className={`${styles.fullscreenBtn} ${hovered || isFullscreen ? styles.visible : ''}`}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit full screen' : 'View full screen'}
          title={isFullscreen ? 'Exit full screen' : 'View full screen'}
        >
          {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
        </button>
        {scale > 1 && (
          <button
            className={styles.resetBtn}
            onClick={() => dispatch({ type: 'reset' })}
            aria-label="Reset zoom"
            title="Reset zoom (double-tap)"
          >
            1×
          </button>
        )}
      </div>
    </ZoomContext.Provider>
  )
}
