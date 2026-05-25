import { useState, useCallback, useEffect, useRef } from 'react'
import { Welcome } from '@/components/Welcome'
import { useImage, type LoadedImage } from '@/hooks/useImage'
import { TOOLS, type Tool } from '@/tools/index'
import { ValueMap } from '@/tools/ValueMap'
import { Notan } from '@/tools/Notan'
import { ColorPicker } from '@/tools/ColorPicker'
import { ShapeSimplify } from '@/tools/ShapeSimplify'
import { Grid } from '@/tools/Grid'
import { Composition } from '@/tools/Composition'
import { Palette } from '@/tools/Palette'
import { Temperature } from '@/tools/Temperature'
import { PaintMix } from '@/tools/PaintMix'
import { Histogram } from '@/tools/Histogram'
import { Dither } from '@/tools/Dither'
import { Edges } from '@/tools/Edges'
import styles from './App.module.css'

type ApplyFn = (canvas: HTMLCanvasElement) => void

function ActiveTool({ tool, image, originalImage, onApply }: { tool: Tool; image: LoadedImage; originalImage: LoadedImage; onApply: ApplyFn }) {
  if (tool === 'value-map') return <ValueMap image={image} originalImage={originalImage} onApply={onApply} />
  if (tool === 'notan') return <Notan image={image} originalImage={originalImage} onApply={onApply} />
  if (tool === 'color-picker') return <ColorPicker image={image} />
  if (tool === 'shape-simplify') return <ShapeSimplify image={image} originalImage={originalImage} onApply={onApply} />
  if (tool === 'dither') return <Dither image={image} originalImage={originalImage} onApply={onApply} />
  if (tool === 'grid') return <Grid image={image} originalImage={originalImage} onApply={onApply} />
  if (tool === 'composition') return <Composition image={image} originalImage={originalImage} onApply={onApply} />
  if (tool === 'palette') return <Palette image={image} />
  if (tool === 'temperature') return <Temperature image={image} originalImage={originalImage} onApply={onApply} />
  if (tool === 'paint-mix') return <PaintMix image={image} />
  if (tool === 'histogram') return <Histogram image={image} />
  if (tool === 'edges') return <Edges image={image} originalImage={originalImage} onApply={onApply} />
  return <p className={styles.placeholder}>{tool} — coming soon</p>
}

const TOOL_LABELS: Record<Tool, string> = {
  'value-map':     'Value Map',
  'notan':         'Notan',
  'color-picker':  'Color Picker',
  'shape-simplify':'Shape Simplify',
  'dither':        'Dither',
  'grid':          'Grid',
  'composition':   'Composition',
  'palette':       'Palette',
  'temperature':   'Temperature',
  'paint-mix':     'Paint Mix',
  'histogram':     'Histogram',
  'edges':         'Edges',
}

export default function App({ onImageChange }: { onImageChange?: (has: boolean) => void }) {
  const { image, originalImage, error, load, clear, push, undo, canUndo, undoDepth } = useImage()
  const [activeTool, setActiveTool] = useState<Tool>('value-map')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const id = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', handler)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [menuOpen])

  useEffect(() => { onImageChange?.(!!image) }, [image, onImageChange])

  const handleApply = useCallback((canvas: HTMLCanvasElement) => {
    push(canvas)
  }, [push])

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.wordmark}>study assist</h1>
        {image && (
          <div className={styles.headerActions}>
            {canUndo && (
              <button className={styles.undoBtn} onClick={undo} aria-label={`Undo — ${undoDepth} step${undoDepth !== 1 ? 's' : ''} back`}>
                Undo{undoDepth > 1 ? ` (${undoDepth})` : ''}
              </button>
            )}
            <button className={styles.clearBtn} onClick={clear} aria-label="Remove image">
              Remove image
            </button>
          </div>
        )}
      </header>

      <main className={styles.main}>
        {!image ? (
          <div className={styles.dropZone}>
            <Welcome onFile={load} error={error ?? undefined} />
          </div>
        ) : (
          <div className={styles.workspace}>
            <nav className={styles.toolbar} aria-label="Tools">
              {TOOLS.map(tool => (
                <button
                  key={tool}
                  className={`${styles.toolBtn} ${activeTool === tool ? styles.active : ''}`}
                  onClick={() => setActiveTool(tool)}
                  aria-pressed={activeTool === tool}
                >
                  {TOOL_LABELS[tool]}
                </button>
              ))}
            </nav>
            <div className={styles.fabContainer} ref={menuRef}>
              <button
                className={styles.fab}
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Open tools menu"
                aria-expanded={menuOpen}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              {menuOpen && (
                <div className={styles.popover} role="dialog" aria-label="Tools">
                  {TOOLS.map(tool => (
                    <button
                      key={tool}
                      className={`${styles.popoverToolBtn} ${activeTool === tool ? styles.active : ''}`}
                      onClick={() => { setActiveTool(tool); setMenuOpen(false) }}
                      aria-pressed={activeTool === tool}
                    >
                      {TOOL_LABELS[tool]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.canvas}>
              <ActiveTool tool={activeTool} image={image} originalImage={originalImage!} onApply={handleApply} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
