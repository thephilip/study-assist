import { useState } from 'react'
import { ImageDrop } from '@/components/ImageDrop'
import { useImage, type LoadedImage } from '@/hooks/useImage'
import { TOOLS, type Tool } from '@/tools/index'
import { ValueMap } from '@/tools/ValueMap'
import { Notan } from '@/tools/Notan'
import { ColorPicker } from '@/tools/ColorPicker'
import { ShapeSimplify } from '@/tools/ShapeSimplify'
import { Grid } from '@/tools/Grid'
import { Palette } from '@/tools/Palette'
import { Temperature } from '@/tools/Temperature'
import { PaintMix } from '@/tools/PaintMix'
import { Histogram } from '@/tools/Histogram'
import styles from './App.module.css'

function ActiveTool({ tool, image }: { tool: Tool; image: LoadedImage }) {
  if (tool === 'value-map') return <ValueMap image={image} />
  if (tool === 'notan') return <Notan image={image} />
  if (tool === 'color-picker') return <ColorPicker image={image} />
  if (tool === 'shape-simplify') return <ShapeSimplify image={image} />
  if (tool === 'grid') return <Grid image={image} />
  if (tool === 'palette') return <Palette image={image} />
  if (tool === 'temperature') return <Temperature image={image} />
  if (tool === 'paint-mix') return <PaintMix image={image} />
  if (tool === 'histogram') return <Histogram image={image} />
  return <p className={styles.placeholder}>{tool} — coming soon</p>
}

const TOOL_LABELS: Record<Tool, string> = {
  'value-map':     'Value Map',
  'notan':         'Notan',
  'color-picker':  'Color Picker',
  'shape-simplify':'Shape Simplify',
  'grid':          'Grid',
  'palette':       'Palette',
  'temperature':   'Temperature',
  'paint-mix':     'Paint Mix',
  'histogram':     'Histogram',
}

export default function App() {
  const { image, error, load, clear } = useImage()
  const [activeTool, setActiveTool] = useState<Tool>('value-map')

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.wordmark}>study assist</span>
        {image && (
          <button className={styles.clearBtn} onClick={clear} aria-label="Remove image">
            ✕ Remove image
          </button>
        )}
      </header>

      <main className={styles.main}>
        {!image ? (
          <div className={styles.dropZone}>
            <ImageDrop onFile={load} />
            {error && <p className={styles.error}>{error}</p>}
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
              <ActiveTool tool={activeTool} image={image} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
