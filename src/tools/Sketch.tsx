import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Panel } from '@/components/Panel'
import { Slider } from '@/components/Slider'
import { drawImageToCanvas } from '@/lib/canvas'
import { downloadCanvas } from '@/lib/export'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { useCompareContext } from '@/context/CompareContext'
import { CanvasWrap } from '@/components/CanvasWrap'
import { SketchEngine } from './sketch'
import type { LoadedImage } from '@/hooks/useImage'
import toolStyles from './Tool.module.css'
import styles from './Sketch.module.css'

type Props = { image: LoadedImage; originalImage: LoadedImage }

/** Generates evenly-spaced greyscale swatches for N levels (black → white). */
function generateSwatches(levels: number): string[] {
  if (levels < 2) return ['#000000']
  const swatches: string[] = []
  for (let i = 0; i < levels; i++) {
    const v = Math.round((i / (levels - 1)) * 255)
    const s = v.toString(16).padStart(2, '0')
    swatches.push(`#${s}${s}${s}`)
  }
  return swatches
}

export function Sketch({ image, originalImage }: Props) {
  // Mirrors engine.strokeCount so Undo/Clear enablement re-renders (the engine
  // itself lives in a ref and mutations there don't trigger React updates)
  const [strokeCount, setStrokeCount] = useState(0)
  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const sketchCanvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SketchEngine | null>(null)
  const drawingRef = useRef(false)

  const [levels, setLevels] = useState(3)
  const [activeSwatch, setActiveSwatch] = useState(1) // index into swatches
  const [brushSize, setBrushSize] = useState(8)
  const [eraser, setEraser] = useState(false)

  const { compare, toggleCompare } = useCompareContext()

  const swatches = useMemo(() => generateSwatches(levels), [levels])
  const activeColor = swatches[activeSwatch] ?? swatches[0]

  // Clamp active swatch when levels change
  useEffect(() => {
    if (activeSwatch >= levels) setActiveSwatch(levels - 1)
  }, [levels, activeSwatch])

  // ── Initialise canvases when image loads ─────────────────────────────────

  useEffect(() => {
    const imgCanvas = imageCanvasRef.current
    const skCanvas = sketchCanvasRef.current
    if (!imgCanvas || !skCanvas) return

    const w = image.bitmap.width
    const h = image.bitmap.height

    // Reference image
    imgCanvas.width = w
    imgCanvas.height = h
    drawImageToCanvas(imgCanvas, image.bitmap)

    // Sketch canvas
    skCanvas.width = w
    skCanvas.height = h

    engineRef.current = new SketchEngine(skCanvas)
    setStrokeCount(0)
  }, [image])

  // Compare shows the root original beside the sketch, like every other tool
  useEffect(() => {
    const canvas = originalCanvasRef.current
    if (!canvas) return
    drawImageToCanvas(canvas, originalImage.bitmap)
  }, [originalImage])

  // ── Coordinate helpers ───────────────────────────────────────────────────

  const canvasToImage = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sketchCanvasRef.current
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 }
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
      pressure: e.pressure,
    }
  }, [])

  // ── Drawing handlers ─────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current
    if (!engine) return

    // Capture pointer so we get move/up even outside the canvas
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    e.preventDefault()

    drawingRef.current = true
    const pt = canvasToImage(e)
    engine.beginStroke(activeColor, brushSize, eraser)
    engine.extendStroke(pt)
  }, [activeColor, brushSize, eraser, canvasToImage])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const engine = engineRef.current
    if (!engine) return
    e.preventDefault()
    const pt = canvasToImage(e)
    engine.extendStroke(pt)
  }, [canvasToImage])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const engine = engineRef.current
    if (!engine) return
    engine.endStroke()
    setStrokeCount(engine.strokeCount)
    ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
  }, [])

  const handlePointerLeave = useCallback(() => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const engine = engineRef.current
    if (!engine) return
    engine.endStroke()
    setStrokeCount(engine.strokeCount)
  }, [])

  // ── Toolbar actions ─────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.undo()
    setStrokeCount(engine.strokeCount)
  }, [])

  const handleClear = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.clear()
    setStrokeCount(engine.strokeCount)
  }, [])

  const handleSaveComposite = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    const w = image.bitmap.width
    const h = image.bitmap.height
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const ctx = tmp.getContext('2d')!
    drawImageToCanvas(tmp, image.bitmap)
    ctx.drawImage(engine.getCanvas(), 0, 0)
    downloadCanvas(tmp, 'sketch-composite.png')
  }, [image])

  const handleSaveSketch = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    downloadCanvas(engine.getCanvas(), 'sketch.png')
  }, [])

  useRegisterToolActions('Sketch', useMemo(() => [
    { id: 'undo', label: 'Undo stroke', handler: handleUndo },
    { id: 'clear', label: 'Clear sketch', handler: handleClear },
    { id: 'save-composite', label: 'Save composite', handler: handleSaveComposite },
    { id: 'save-sketch', label: 'Save sketch only', handler: handleSaveSketch },
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
  ], [handleUndo, handleClear, handleSaveComposite, handleSaveSketch, compare, toggleCompare]))

  // ── Render ───────────────────────────────────────────────────────────────

  const hasStrokes = strokeCount > 0

  return (
    <div className={toolStyles.root}>
      <CanvasWrap compare={compare}>
        <canvas
          ref={originalCanvasRef}
          className={`${toolStyles.canvas} ${!compare ? toolStyles.hidden : ''}`}
          role="img"
          aria-label="Original image"
        />
        <div className={toolStyles.overlayFrame}>
          <canvas
            ref={imageCanvasRef}
            className={toolStyles.canvas}
            role="img"
            aria-label="Reference image"
          />
          <canvas
            ref={sketchCanvasRef}
            className={styles.sketchCanvas}
            role="img"
            aria-label="Sketch layer — draw with pointer or stylus"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
          />
        </div>
      </CanvasWrap>

      <Panel className={toolStyles.controls} toolSlug="sketch">
        <h2 className={toolStyles.toolName}>Sketch</h2>
        <p className={toolStyles.description}>
          Draw value thumbnails directly over the reference. Supports pressure-sensitive styluses.
        </p>

        {/* ── Value levels ─────────────────────────────────────────────── */}
        <Slider
          label="Value levels"
          value={levels}
          min={2}
          max={8}
          onChange={setLevels}
        />

        {/* ── Colour swatches ──────────────────────────────────────────── */}
        <div className={styles.swatchRow} role="radiogroup" aria-label="Drawing colour">
          {swatches.map((hex, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.swatch} ${i === activeSwatch ? styles.swatchActive : ''}`}
              style={{ background: hex }}
              onClick={() => { setActiveSwatch(i); setEraser(false) }}
              aria-label={`Value ${i + 1} of ${levels}`}
              aria-pressed={i === activeSwatch}
            />
          ))}
        </div>

        {/* ── Brush size ───────────────────────────────────────────────── */}
        <Slider
          label="Brush size"
          value={brushSize}
          min={1}
          max={40}
          onChange={setBrushSize}
        />

        {/* ── Mode toggle ──────────────────────────────────────────────── */}
        <div className={styles.modeRow}>
          <button
            type="button"
            className={`${styles.modeBtn} ${!eraser ? styles.modeActive : ''}`}
            onClick={() => setEraser(false)}
            aria-pressed={!eraser}
          >
            Draw
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${eraser ? styles.modeActive : ''}`}
            onClick={() => setEraser(true)}
            aria-pressed={eraser}
          >
            Eraser
          </button>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleUndo}
            disabled={!hasStrokes}
          >
            Undo
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleClear}
            disabled={!hasStrokes}
          >
            Clear
          </button>
        </div>
      </Panel>
    </div>
  )
}
