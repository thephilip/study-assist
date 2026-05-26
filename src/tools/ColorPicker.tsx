import { useRef, useEffect, useState, useCallback } from 'react'
import { Panel } from '@/components/Panel'
import { Slider } from '@/components/Slider'
import { drawImageToCanvas, getPixelData } from '@/lib/canvas'
import {
  rgbToHex, rgbToHsl, rgbToLab, rgbToCmyk,
  type RGB,
} from '@/lib/color'
import { sampleRegion } from './color-picker'
import type { LoadedImage } from '@/hooks/useImage'
import styles from './ColorPicker.module.css'
import { CanvasWrap, useZoom } from '@/components/CanvasWrap'
import { useFlip } from '@/context/FlipContext'
import toolStyles from './Tool.module.css'

type Props = { image: LoadedImage }

type PickState = {
  color: RGB
  // position in canvas CSS pixels, for the indicator ring
  x: number
  y: number
  locked: boolean
}

function pct(n: number) { return `${Math.round(n * 100)}%` }
function deg(n: number) { return `${Math.round(n * 360)}°` }
function fmt1(n: number) { return n.toFixed(1) }

export function ColorPicker({ image }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageDataRef = useRef<ImageData | null>(null)
  const [radius, setRadius] = useState(1)
  const [pick, setPick] = useState<PickState | null>(null)
  const { scale } = useZoom()
  const { flipX, flipY } = useFlip()

  // Draw image once per source image
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const tmp = document.createElement('canvas')
    drawImageToCanvas(tmp, image.bitmap)
    imageDataRef.current = getPixelData(tmp)
    canvas.width = tmp.width
    canvas.height = tmp.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(tmp, 0, 0)
  }, [image])

  const sampleAt = useCallback((clientX: number, clientY: number, locked: boolean) => {
    const canvas = canvasRef.current
    const data = imageDataRef.current
    if (!canvas || !data) return
    const rect = canvas.getBoundingClientRect()
    const pxScaleX = canvas.width / rect.width
    const pxScaleY = canvas.height / rect.height
    const dx = clientX - rect.left
    const dy = clientY - rect.top
    const ix = flipX ? canvas.width - dx * pxScaleX : dx * pxScaleX
    const iy = flipY ? canvas.height - dy * pxScaleY : dy * pxScaleY
    const color = sampleRegion(data, ix, iy, radius)
    const dispX = flipX ? (rect.width - dx) / scale : dx / scale
    const dispY = flipY ? (rect.height - dy) / scale : dy / scale
    setPick({ color, x: dispX, y: dispY, locked })
  }, [radius, scale, flipX, flipY])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    sampleAt(e.clientX, e.clientY, false)
  }, [sampleAt])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pick?.locked) return
    sampleAt(e.clientX, e.clientY, false)
  }, [pick?.locked, sampleAt])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    sampleAt(e.clientX, e.clientY, true)
  }, [sampleAt])

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return
    if (!pick?.locked) setPick(null)
  }, [pick?.locked])

  const color = pick?.color ?? null
  const hex = color ? rgbToHex(color) : null
  const hsl = color ? rgbToHsl(color) : null
  const lab = color ? rgbToLab(color) : null
  const cmyk = color ? rgbToCmyk(color) : null

  return (
    <div className={toolStyles.root}>
      <CanvasWrap>
        <div className={styles.canvasFrame}>
          <canvas
            ref={canvasRef}
            className={`${toolStyles.canvas} ${styles.canvas}`}
            role="img"
            aria-label="Reference image — move pointer to preview a color, click to lock"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
          />
          {pick && (
            <div
              className={`${styles.ring} ${pick.locked ? styles.locked : ''}`}
              style={{ left: pick.x, top: pick.y }}
              aria-hidden
            />
          )}
        </div>
      </CanvasWrap>

      <Panel className={toolStyles.controls}>
        <h2 className={toolStyles.toolName}>Color Picker</h2>
        <p className={toolStyles.description}>
          Move or drag to preview — click or lift to lock. Increase radius to average a region.
        </p>

        <Slider label="Sample radius" value={radius} min={1} max={20} onChange={setRadius} />

        {color && hex && hsl && lab && cmyk ? (
          <div className={styles.info}>
            <div className={styles.swatch} style={{ background: hex }}>
              <button
                className={styles.hexBadge}
                onClick={() => navigator.clipboard.writeText(hex)}
                aria-label={`Copy ${hex}`}
                title="Copy hex"
              >
                {hex}
              </button>
            </div>

            <table className={styles.table}>
              <tbody>
                <tr>
                  <th>RGB</th>
                  <td>{color.r}, {color.g}, {color.b}</td>
                </tr>
                <tr>
                  <th>HSL</th>
                  <td>{deg(hsl.h)} {pct(hsl.s)} {pct(hsl.l)}</td>
                </tr>
                <tr>
                  <th>LAB</th>
                  <td>{fmt1(lab.l)} {fmt1(lab.a)} {fmt1(lab.b)}</td>
                </tr>
                <tr>
                  <th>CMYK</th>
                  <td>{pct(cmyk.c)} {pct(cmyk.m)} {pct(cmyk.y)} {pct(cmyk.k)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.empty}>Move or drag over the image to sample</p>
        )}
      </Panel>
    </div>
  )
}
