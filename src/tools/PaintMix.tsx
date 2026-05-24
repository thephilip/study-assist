import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas, getPixelData } from '@/lib/canvas'
import { rgbToHex, rgbToLab, type RGB } from '@/lib/color'
import { sampleRegion } from './color-picker'
import {
  PIGMENTS,
  findTopSingles,
  findBestMix,
  type Brand,
  type SingleMatch,
  type MixMatch,
} from '@/lib/pigments'
import type { LoadedImage } from '@/hooks/useImage'
import toolStyles from './Tool.module.css'
import styles from './PaintMix.module.css'

type Props = { image: LoadedImage }

const ALL_BRANDS: Brand[] = ['Gamblin', 'W&N', 'Williamsburg', 'Rembrandt']
const BRAND_SHORT: Record<Brand, string> = {
  'Gamblin': 'Gamblin',
  'W&N': 'W&N',
  'Williamsburg': 'Wmsburg',
  'Rembrandt': 'Rembdt',
}

function pct(n: number) { return `${Math.round(n * 100)}%` }
function rgbToHexStr({ r, g, b }: RGB) { return rgbToHex({ r, g, b }) }

export function PaintMix({ image }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const imageDataRef = useRef<ImageData | null>(null)
  const [pick, setPick] = useState<{ color: RGB; x: number; y: number } | null>(null)
  const [activeBrands, setActiveBrands] = useState<Set<Brand>>(new Set(ALL_BRANDS))

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
    setPick(null)
  }, [image])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const data = imageDataRef.current
    if (!canvas || !wrap || !data) return
    const rect = canvas.getBoundingClientRect()
    const wrapRect = wrap.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const ix = (e.clientX - rect.left) * scaleX
    const iy = (e.clientY - rect.top) * scaleY
    const color = sampleRegion(data, ix, iy, 3)
    setPick({ color, x: e.clientX - wrapRect.left, y: e.clientY - wrapRect.top })
  }, [])

  const toggleBrand = useCallback((brand: Brand) => {
    setActiveBrands(prev => {
      const next = new Set(prev)
      if (next.has(brand)) {
        if (next.size > 1) next.delete(brand)
      } else {
        next.add(brand)
      }
      return next
    })
  }, [])

  const filteredPaints = useMemo(
    () => PIGMENTS.filter(p => activeBrands.has(p.brand)),
    [activeBrands],
  )

  const results = useMemo<{ singles: SingleMatch[]; mix: MixMatch | null } | null>(() => {
    if (!pick) return null
    const target = rgbToLab(pick.color)
    return {
      singles: findTopSingles(target, filteredPaints, 3),
      mix: findBestMix(target, filteredPaints),
    }
  }, [pick, filteredPaints])

  const hex = pick ? rgbToHexStr(pick.color) : null

  return (
    <div className={toolStyles.root}>
      <div ref={wrapRef} className={toolStyles.canvasWrap} style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          className={toolStyles.canvas}
          role="img"
          aria-label="Reference image — click to sample a color for paint matching"
          style={{ cursor: 'crosshair' }}
          onPointerUp={handlePointerUp}
        />
        {pick && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: pick.x,
              top: pick.y,
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid #fff',
              outline: '1px solid #000',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <Panel className={toolStyles.controls}>
        <h2 className={toolStyles.toolName}>Paint Mix</h2>
        <p className={toolStyles.description}>
          Tap or click the image to sample a color, then see the closest paints and a suggested 2-paint mix.
        </p>

        {/* Brand filter */}
        <div className={styles.brands}>
          {ALL_BRANDS.map(brand => (
            <button
              key={brand}
              className={`${styles.brandBtn} ${activeBrands.has(brand) ? styles.active : ''}`}
              onClick={() => toggleBrand(brand)}
              aria-pressed={activeBrands.has(brand)}
            >
              {BRAND_SHORT[brand]}
            </button>
          ))}
        </div>

        {!pick && (
          <p className={styles.prompt}>Tap or click anywhere on the image to sample a color.</p>
        )}

        {pick && hex && results && (
          <>
            {/* Picked color */}
            <div className={styles.pickedSwatch} style={{ background: hex }} />
            <div className={styles.pickedMeta}>
              <span>{hex}</span>
              <span>{pick.color.r}, {pick.color.g}, {pick.color.b}</span>
            </div>

            {/* Closest single paints */}
            <p className={styles.sectionLabel}>Closest paints</p>
            {results.singles.length === 0 ? (
              <p className={styles.noResults}>No paints in selected brands.</p>
            ) : (
              results.singles.map(({ paint, dE }) => (
                <div key={paint.id} className={styles.matchRow}>
                  <div
                    className={styles.matchSwatch}
                    style={{ background: rgbToHex(paint.rgb) }}
                  />
                  <div className={styles.matchInfo}>
                    <div className={styles.matchName}>{paint.name}</div>
                    <div className={styles.matchBrand}>{paint.brand} · {paint.pigmentCode}</div>
                  </div>
                  <span className={styles.matchDe}>ΔE {dE.toFixed(1)}</span>
                </div>
              ))
            )}

            {/* Best 2-paint mix */}
            {results.mix && (
              <>
                <p className={styles.sectionLabel}>Nearest mix</p>
                <div className={styles.mixResult}>
                  <div className={styles.mixSwatches}>
                    <div
                      className={styles.mixSwatchA}
                      style={{
                        background: rgbToHex(results.mix.a.rgb),
                        flex: results.mix.aFraction,
                      }}
                    />
                    <div
                      className={styles.mixSwatchB}
                      style={{
                        background: rgbToHex(results.mix.b.rgb),
                        flex: 1 - results.mix.aFraction,
                      }}
                    />
                  </div>
                  <div className={styles.mixPaint}>
                    <span className={styles.mixFraction}>{pct(results.mix.aFraction)}</span>
                    <div className={styles.matchInfo}>
                      <div className={styles.matchName}>{results.mix.a.name}</div>
                      <div className={styles.matchBrand}>{results.mix.a.brand}</div>
                    </div>
                  </div>
                  <div className={styles.mixPaint}>
                    <span className={styles.mixFraction}>{pct(1 - results.mix.aFraction)}</span>
                    <div className={styles.matchInfo}>
                      <div className={styles.matchName}>{results.mix.b.name}</div>
                      <div className={styles.matchBrand}>{results.mix.b.brand}</div>
                    </div>
                  </div>
                  <div className={styles.mixDe}>ΔE {results.mix.dE.toFixed(1)}</div>
                </div>
              </>
            )}

            <p className={styles.disclaimer}>
              Mix ratios are LAB linear approximations — use as a starting point, not a precise formula.
            </p>
          </>
        )}
      </Panel>
    </div>
  )
}
