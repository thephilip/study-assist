import { useState, useCallback, useEffect, useMemo } from 'react'
import { Welcome } from '@/components/Welcome'
import { useImage, type LoadedImage } from '@/hooks/useImage'
import { ActionsProvider } from '@/context/ActionsContext'
import { ActionsMenu } from '@/components/ActionsMenu'
import { ToolsMenu } from '@/components/ToolsMenu'
import { TOOLS, TOOL_LABELS, type Tool } from '@/tools/index'
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


export default function App({ onImageChange }: { onImageChange?: (has: boolean) => void }) {
  const { image, originalImage, error, load, clear, push, undo, canUndo, undoDepth } = useImage()
  const [activeTool, setActiveTool] = useState<Tool>('value-map')

  const globalActions = useMemo(() => image ? [
    { id: 'remove-image', label: 'Remove image', handler: clear, danger: true },
  ] : [], [image, clear])

  useEffect(() => { onImageChange?.(!!image) }, [image, onImageChange])

  const handleApply = useCallback((canvas: HTMLCanvasElement) => {
    push(canvas)
  }, [push])

  return (
    <ActionsProvider globalActions={globalActions}>
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.wordmark}>study assist</h1>
        {image && (
          <div className={styles.headerActions}>
            <ToolsMenu activeTool={activeTool} onSelect={setActiveTool} />
            <ActionsMenu />
            {canUndo && (
              <button className={styles.undoBtn} onClick={undo} aria-label={`Undo — ${undoDepth} step${undoDepth !== 1 ? 's' : ''} back`}>
                Undo{undoDepth > 1 ? ` (${undoDepth})` : ''}
              </button>
            )}
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
            <div className={styles.canvas}>
              <ActiveTool tool={activeTool} image={image} originalImage={originalImage!} onApply={handleApply} />
            </div>
          </div>
        )}
      </main>
    </div>
    </ActionsProvider>
  )
}
