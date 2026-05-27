import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas } from '@/lib/canvas'
import { useRegisterToolActions } from '@/context/ActionsContext'
import { useCompareContext } from '@/context/CompareContext'
import { CanvasWrap, useZoom } from '@/components/CanvasWrap'
import { ASPECT_PRESETS, defaultRect, clampToImage, resizeCorner, resizeEdge, translateRect, type AspectRatio, type Rect } from './view-catcher'
import type { LoadedImage } from '@/hooks/useImage'
import toolStyles from './Tool.module.css'
import styles from './ViewCatcher.module.css'

type Props = {
  image: LoadedImage
  originalImage: LoadedImage
  onApply: (canvas: HTMLCanvasElement) => void
}

type DragMode = 
  | { type: 'idle' }
  | { type: 'body'; startX: number; startY: number; rect: Rect }
  | { type: 'corner'; idx: number; rect: Rect }
  | { type: 'edge'; idx: number; rect: Rect }

const HANDLE_SIZE = 10
const MIN_CROP = 24

// ── Component ─────────────────────────────────────────────────────────────────

export function ViewCatcher({ image, originalImage, onApply }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalRef = useRef<HTMLCanvasElement>(null)
  const { scale } = useZoom()
  const { compare, toggleCompare } = useCompareContext()

  const [aspect, setAspect] = useState<AspectRatio>(ASPECT_PRESETS[1]) // 3:4 default
  const [crop, setCrop] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const dragRef = useRef<DragMode>({ type: 'idle' })
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 })
  const [savedCrop, setSavedCrop] = useState<Rect | null>(null)

  // Reset crop when a new image is loaded (e.g. after Save crop → onApply replaces the bitmap)
  // The render effect below will re-initialise it to a fresh default for the new dimensions.
  useEffect(() => {
    setCrop({ x: 0, y: 0, w: 0, h: 0 })
    setSavedCrop(null)
  }, [image])

  // ── Drawing ─────────────────────────────────────────────────────────────────

  // Draw the original image for compare mode.
  // After a crop has been saved, show the same region of the original for a fair comparison
  // instead of the full uncropped image (both canvases then match in size and content).
  useEffect(() => {
    const canvas = originalRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (compare && savedCrop) {
      // Match the crop region so both canvases show identical content at the same scale
      const { x, y, w, h } = savedCrop
      canvas.width = Math.round(w)
      canvas.height = Math.round(h)
      ctx.drawImage(originalImage.bitmap, x, y, w, h, 0, 0, w, h)
    } else {
      // Full-size original
      canvas.width = originalImage.bitmap.width
      canvas.height = originalImage.bitmap.height
      drawImageToCanvas(canvas, originalImage.bitmap)
    }
  }, [originalImage, compare, savedCrop])

  // Main render: image + dim overlay + crop outline + handles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    drawImageToCanvas(canvas, image.bitmap)
    const w = canvas.width
    const h = canvas.height

    // Initialise crop on first render
    if (crop.w === 0 || crop.h === 0) {
      const def = defaultRect(w, h, aspect)
      setCrop(def)
      setImgDims({ w, h })
      // Draw just the image for now (no overlay yet)
      return
    }

    const ctx = canvas.getContext('2d')!

    // 1. Draw dim overlay only outside the crop region using a clip path
    ctx.save()
    ctx.beginPath()
    // Outer rect (clockwise) — full canvas
    ctx.rect(0, 0, w, h)
    // Inner rect (counter-clockwise) — punches a hole for the crop region
    ctx.rect(crop.x + crop.w, crop.y, -crop.w, crop.h)
    ctx.clip()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(0, 0, w, h)
    ctx.restore()

    // 2. Draw crop rectangle outline
    ctx.save()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h)

    // 3. Draw corner handles (10×10 squares)
    ctx.fillStyle = '#ffffff'
    const corners = [
      [crop.x, crop.y],                          // TL
      [crop.x + crop.w, crop.y],                  // TR
      [crop.x, crop.y + crop.h],                  // BL
      [crop.x + crop.w, crop.y + crop.h],         // BR
    ]
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - HANDLE_SIZE / 2, cy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
    }

    // 4. Draw edge-midpoint handles (6×6 diamonds)
    const ES = 6 // edge handle size
    ctx.fillStyle = '#ffffff'
    const edges = [
      [crop.x + crop.w / 2, crop.y],             // top
      [crop.x + crop.w, crop.y + crop.h / 2],    // right
      [crop.x + crop.w / 2, crop.y + crop.h],    // bottom
      [crop.x, crop.y + crop.h / 2],             // left
    ]
    for (const [ex, ey] of edges) {
      ctx.beginPath()
      ctx.moveTo(ex, ey - ES / 2)    // top point
      ctx.lineTo(ex + ES / 2, ey)    // right point
      ctx.lineTo(ex, ey + ES / 2)    // bottom point
      ctx.lineTo(ex - ES / 2, ey)    // left point
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }, [image, crop, aspect])

  // ── Pointer handling ────────────────────────────────────────────────────────

  const toCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }, [])

  const hitTest = useCallback((
    px: number, py: number, rect: Rect,
  ): { type: 'corner'; idx: number } | { type: 'edge'; idx: number } | { type: 'body' } | null => {
    // Corner handles (highest priority)
    const corners = [
      [rect.x, rect.y],                    // TL — idx 0
      [rect.x + rect.w, rect.y],           // TR — idx 1
      [rect.x, rect.y + rect.h],           // BL — idx 2
      [rect.x + rect.w, rect.y + rect.h],  // BR — idx 3
    ]
    for (let i = 0; i < corners.length; i++) {
      const [hx, hy] = corners[i]
      if (Math.abs(px - hx) < HANDLE_SIZE + 2 && Math.abs(py - hy) < HANDLE_SIZE + 2) {
        return { type: 'corner', idx: i }
      }
    }

    // Edge midpoints (0=top, 1=right, 2=bottom, 3=left)
    const edgeHit = HANDLE_SIZE + 2
    const edges = [
      [rect.x + rect.w / 2, rect.y],          // top
      [rect.x + rect.w, rect.y + rect.h / 2],  // right
      [rect.x + rect.w / 2, rect.y + rect.h],  // bottom
      [rect.x, rect.y + rect.h / 2],           // left
    ]
    for (let i = 0; i < edges.length; i++) {
      const [ex, ey] = edges[i]
      if (Math.abs(px - ex) < edgeHit && Math.abs(py - ey) < edgeHit) {
        return { type: 'edge', idx: i }
      }
    }

    // Body
    if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
      return { type: 'body' }
    }

    return null
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (crop.w === 0) return
    const pt = toCanvasCoords(e.clientX, e.clientY)
    const hit = hitTest(pt.x, pt.y, crop)
    if (!hit) return

    // When zoomed, only allow handle interaction (corner or edge) — body drag would
    // conflict with CanvasWrap's pan gesture.
    if (scale > 1 && hit.type === 'body') return

    e.preventDefault()
    const canvas = canvasRef.current
    canvas?.setPointerCapture(e.pointerId)

    if (hit.type === 'body') {
      dragRef.current = { type: 'body', startX: pt.x, startY: pt.y, rect: { ...crop } }
    } else if (hit.type === 'corner') {
      dragRef.current = { type: 'corner', idx: hit.idx, rect: { ...crop } }
    } else {
      dragRef.current = { type: 'edge', idx: hit.idx, rect: { ...crop } }
    }
  }, [scale, crop, toCanvasCoords, hitTest])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    if (d.type === 'idle') return
    const pt = toCanvasCoords(e.clientX, e.clientY)

    if (d.type === 'body') {
      const dx = pt.x - d.startX
      const dy = pt.y - d.startY
      setCrop(translateRect(d.rect, dx, dy, imgDims.w, imgDims.h))
    } else if (d.type === 'corner') {
      setCrop(resizeCorner(d.rect, d.idx, pt.x, pt.y, aspect, imgDims.w, imgDims.h))
    } else if (d.type === 'edge') {
      setCrop(resizeEdge(d.rect, d.idx, pt.x, pt.y, aspect, imgDims.w, imgDims.h))
    }
  }, [toCanvasCoords, aspect, imgDims])

  const handlePointerUp = useCallback(() => {
    dragRef.current = { type: 'idle' }
  }, [])

  // ── Aspect ratio change ────────────────────────────────────────────────────

  const handleAspectChange = useCallback((ratio: AspectRatio) => {
    setAspect(ratio)
    // Re-centre the crop with the new ratio, preserving centre
    if (imgDims.w > 0 && imgDims.h > 0) {
      const cx = crop.x + crop.w / 2
      const cy = crop.y + crop.h / 2
      // Fit the new aspect ratio around the same centre
      let w = crop.w
      let h = w * (ratio.h / ratio.w)
      if (h > imgDims.h * 0.9) {
        h = imgDims.h * 0.9
        w = h * (ratio.w / ratio.h)
      }
      const r = clampToImage({
        x: cx - w / 2,
        y: cy - h / 2,
        w,
        h,
      }, imgDims.w, imgDims.h)
      setCrop(r)
    }
  }, [crop, imgDims])

  // ── Save crop ──────────────────────────────────────────────────────────────

  const handleSaveCrop = useCallback(() => {
    const c = canvasRef.current
    if (!c || crop.w < MIN_CROP || crop.h < MIN_CROP) return

    // Render the bitmap at canvas (display) resolution onto a clean temp canvas
    // so we extract the exact visible region without overlay artifacts
    const clean = document.createElement('canvas')
    clean.width = c.width
    clean.height = c.height
    const cleanCtx = clean.getContext('2d')!
    cleanCtx.drawImage(image.bitmap, 0, 0, c.width, c.height)

    // Extract the crop region from the clean image
    const cw = Math.round(crop.w)
    const ch = Math.round(crop.h)
    const out = document.createElement('canvas')
    out.width = cw
    out.height = ch
    const outCtx = out.getContext('2d')!
    outCtx.drawImage(clean, crop.x, crop.y, crop.w, crop.h, 0, 0, cw, ch)

    // Store the crop rect so compare mode can show the same region of the original
    setSavedCrop(crop)
    onApply(out)
  }, [crop, image.bitmap, onApply])

  // ── Actions ─────────────────────────────────────────────────────────────────

  useRegisterToolActions('ViewCatcher', useMemo(() => [
    { id: 'compare', label: 'Compare', checked: compare, handler: toggleCompare },
    { id: 'save-crop', label: 'Save crop', handler: handleSaveCrop },
  ], [compare, toggleCompare, handleSaveCrop]))

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={toolStyles.root}>
      <CanvasWrap compare={compare}>
        <canvas
          ref={originalRef}
          className={`${toolStyles.canvas} ${!compare ? toolStyles.hidden : ''}`}
          role="img"
          aria-label="Original image"
        />
        <canvas
          ref={canvasRef}
          className={toolStyles.canvas}
          role="img"
          aria-label="Cropping viewfinder — drag corners or edges to resize, body to reposition"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ cursor: scale > 1 ? 'grab' : 'crosshair' }}
        />
      </CanvasWrap>

      <Panel className={toolStyles.controls} toolSlug="view-catcher">
        <h2 className={toolStyles.toolName}>ViewCatcher</h2>
        <p className={toolStyles.description}>
          Try different aspect ratios before committing to a panel size. Drag the crop window to recompose.
        </p>

        {/* Aspect ratio presets */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Aspect ratio</span>
          <div className={styles.presetGroup}>
            <span className={styles.groupLabel}>Square</span>
            <div className={styles.presets}>
              {ASPECT_PRESETS.filter(r => r.label === '1:1').map(r => (
                <button
                  key={r.label}
                  type="button"
                  className={`${styles.preset} ${aspect.label === r.label ? styles.active : ''}`}
                  onClick={() => handleAspectChange(r)}
                  aria-pressed={aspect.label === r.label}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.presetGroup}>
            <span className={styles.groupLabel}>Standard</span>
            <div className={styles.presets}>
              {ASPECT_PRESETS.filter(r => ['3:4', '4:5', '5:7', '8:10'].includes(r.label)).map(r => (
                <button
                  key={r.label}
                  type="button"
                  className={`${styles.preset} ${aspect.label === r.label ? styles.active : ''}`}
                  onClick={() => handleAspectChange(r)}
                  aria-pressed={aspect.label === r.label}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.presetGroup}>
            <span className={styles.groupLabel}>Landscape</span>
            <div className={styles.presets}>
              {ASPECT_PRESETS.filter(r => ['16:9', '2:1', '3:2'].includes(r.label)).map(r => (
                <button
                  key={r.label}
                  type="button"
                  className={`${styles.preset} ${aspect.label === r.label ? styles.active : ''}`}
                  onClick={() => handleAspectChange(r)}
                  aria-pressed={aspect.label === r.label}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.presetGroup}>
            <span className={styles.groupLabel}>Panoramic</span>
            <div className={styles.presets}>
              {ASPECT_PRESETS.filter(r => r.label === '3:1').map(r => (
                <button
                  key={r.label}
                  type="button"
                  className={`${styles.preset} ${aspect.label === r.label ? styles.active : ''}`}
                  onClick={() => handleAspectChange(r)}
                  aria-pressed={aspect.label === r.label}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Crop info */}
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Aspect</span>
            <span className={styles.infoValue}>{aspect.label}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Region</span>
            <span className={styles.infoValue}>
              {Math.round(crop.w)} × {Math.round(crop.h)} px
            </span>
          </div>
        </div>

        {/* Save crop button */}
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSaveCrop}
          disabled={crop.w < MIN_CROP || crop.h < MIN_CROP}
        >
          Save crop as new image
        </button>
      </Panel>
    </div>
  )
}
