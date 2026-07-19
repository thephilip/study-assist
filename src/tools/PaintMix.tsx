import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas, getPixelData } from '@/lib/canvas'
import { rgbToHex, rgbToLab, type RGB } from '@/lib/color'
import { sampleRegion } from './color-picker'
import {
  PIGMENTS,
  ALL_BRANDS,
  findTopSingles,
  findBestMixes,
  type Brand,
  type SingleMatch,
  type MixMatch,
  type MixResults,
} from '@/lib/pigments'
import { isBrandUnlocked, getUnlockedBrands, isFeatureUnlocked } from '@/lib/entitlements'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap, useZoom } from '@/components/CanvasWrap'
import { UpgradeModal } from '@/components/UpgradeModal'
import toolStyles from './Tool.module.css'
import styles from './PaintMix.module.css'

type Props = { image: LoadedImage }

const BRAND_SHORT: Record<Brand, string> = {
  'Gamblin':     'Gamblin',
  'W&N':         'W&N',
  'Williamsburg':'Wmsburg',
  'Rembrandt':   'Rembdt',
  'Utrecht':     'Utrecht',
  'Geneva':      'Geneva',
}

function pct(n: number) { return `${Math.round(n * 100)}%` }
function rgbToHexStr({ r, g, b }: RGB) { return rgbToHex({ r, g, b }) }
function renderMixMatch(m: MixMatch) {
  return (
    <>
      <div className={styles.mixSwatches}>
        <div className={styles.mixSwatchA} style={{ background: rgbToHex(m.a.rgb), flex: m.aFraction }} />
        <div className={styles.mixSwatchB} style={{ background: rgbToHex(m.b.rgb), flex: 1 - m.aFraction }} />
      </div>
      <div className={styles.mixPaint}>
        <span className={styles.mixFraction}>{pct(m.aFraction)}</span>
        <div className={styles.matchInfo}>
          <div className={styles.matchName}>{m.a.name}</div>
          <div className={styles.matchBrand}>{m.a.brand}</div>
        </div>
      </div>
      <div className={styles.mixPaint}>
        <span className={styles.mixFraction}>{pct(1 - m.aFraction)}</span>
        <div className={styles.matchInfo}>
          <div className={styles.matchName}>{m.b.name}</div>
          <div className={styles.matchBrand}>{m.b.brand}</div>
        </div>
      </div>
      <div className={styles.mixDe}>ΔE {m.dE.toFixed(1)}</div>
    </>
  )
}

export function PaintMix({ image }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageDataRef = useRef<ImageData | null>(null)
  const [pick, setPick] = useState<{ color: RGB; x: number; y: number } | null>(null)
  const [activeBrands, setActiveBrands] = useState<Set<Brand>>(new Set(getUnlockedBrands()))
  const [proMixUnlocked, setProMixUnlocked] = useState(() => isFeatureUnlocked('pro-mix'))
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showMoreMixes, setShowMoreMixes] = useState(false)
  const { scale } = useZoom()

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
    const data = imageDataRef.current
    if (!canvas || !data) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const ix = (e.clientX - rect.left) * scaleX
    const iy = (e.clientY - rect.top) * scaleY
    const color = sampleRegion(data, ix, iy, 3)
    setPick({ color, x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale })
  }, [scale])

  const toggleBrand = useCallback((brand: Brand) => {
    if (!isBrandUnlocked(brand)) {
      setShowUpgradeModal(true)
      return
    }
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

  const results = useMemo<{ singles: SingleMatch[]; bestMix: MixMatch | null; allMixes: MixResults | null } | null>(() => {
    if (!pick) return null
    const target = rgbToLab(pick.color)
    const all = findBestMixes(target, filteredPaints)
    return {
      singles: findTopSingles(target, filteredPaints, 3),
      bestMix: all?.twoPaint[0] ?? null,
      allMixes: all,
    }
  }, [pick, filteredPaints])

  const hex = pick ? rgbToHexStr(pick.color) : null

  return (
    <div className={toolStyles.root}>
      <CanvasWrap>
        <div className={toolStyles.overlayFrame}>
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
      </CanvasWrap>

      <Panel className={toolStyles.controls} toolSlug="paint-mix">
        <h2 className={toolStyles.toolName}>Paint Mix</h2>
        <p className={toolStyles.description}>
          Tap or click the image to sample a color, then see the closest paints and a suggested 2-paint mix. Pro users can unlock alternative mixes and 3-paint combinations.
        </p>

        {/* Brand filter */}
        <div className={styles.brands}>
          {ALL_BRANDS.map(brand => {
            const free = isBrandUnlocked(brand)
            const active = activeBrands.has(brand)
            return (
              <button
                key={brand}
                className={`${styles.brandBtn} ${active ? styles.active : ''} ${!free ? styles.locked : ''}`}
                onClick={() => toggleBrand(brand)}
                aria-pressed={free ? active : undefined}
                aria-label={free ? undefined : `${brand} — Pro brand pack`}
              >
                {BRAND_SHORT[brand]}
                {!free && <span className={styles.lockIcon} aria-hidden>🔒</span>}
              </button>
            )
          })}
        </div>

        {showUpgradeModal && (
          <UpgradeModal
            title="Brand Packs & Pro Features"
            body="Additional brand packs and Pro features (alternative mixes, 3-paint combinations) are coming with the native app. The free tier includes the full Gamblin range and single best mix."
            onClose={() => setShowUpgradeModal(false)}
            onUnlock={() => { setActiveBrands(new Set(getUnlockedBrands())); setProMixUnlocked(isFeatureUnlocked('pro-mix')) }}
          />
        )}


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
            {results.bestMix && (
              <>
                <p className={styles.sectionLabel}>Nearest mix</p>
                {renderMixMatch(results.bestMix)}

                {/* More mixes (Pro feature) */}
                {results.allMixes && (results.allMixes.twoPaint.length > 1 || results.allMixes.threePaint.length > 0) && (
                  <>
                    {proMixUnlocked ? (
                      <>
                        <button
                          type="button"
                          className={styles.moreToggle}
                          onClick={() => setShowMoreMixes(prev => !prev)}
                          aria-expanded={showMoreMixes}
                        >
                          {showMoreMixes ? 'Hide' : 'Show'} more mixes
                          <span className={`${styles.moreArrow} ${showMoreMixes ? styles.moreArrowUp : ''}`} aria-hidden>▸</span>
                        </button>

                        {showMoreMixes && (
                          <div className={styles.moreMixes}>
                            {/* Alternative 2-paint mixes (skip index 0 = best) */}
                            {results.allMixes.twoPaint.length > 1 && (
                              <>
                                <p className={styles.sectionLabel}>Alternative 2-paint mixes</p>
                                {results.allMixes.twoPaint.slice(1).map((m, i) => (
                                  <div key={i} className={styles.mixResult}>
                                    {renderMixMatch(m)}
                                  </div>
                                ))}
                              </>
                            )}

                            {/* 3-paint mixes */}
                            {results.allMixes.threePaint.length > 0 && (
                              <>
                                <p className={styles.sectionLabel}>3-paint mixes</p>
                                {results.allMixes.threePaint.map((m, i) => (
                                  <div key={i} className={styles.mixResult}>
                                    <div className={styles.mixSwatches}>
                                      <div className={styles.mixSwatchA} style={{ background: rgbToHex(m.a.rgb), flex: m.fractions[0] }} />
                                      <div className={styles.mixSwatchB} style={{ background: rgbToHex(m.b.rgb), flex: m.fractions[1] }} />
                                      <div className={styles.mixSwatchC} style={{ background: rgbToHex(m.c.rgb), flex: m.fractions[2] }} />
                                    </div>
                                    <div className={styles.mixPaint}>
                                      <span className={styles.mixFraction}>{pct(m.fractions[0])}</span>
                                      <div className={styles.matchInfo}>
                                        <div className={styles.matchName}>{m.a.name}</div>
                                        <div className={styles.matchBrand}>{m.a.brand}</div>
                                      </div>
                                    </div>
                                    <div className={styles.mixPaint}>
                                      <span className={styles.mixFraction}>{pct(m.fractions[1])}</span>
                                      <div className={styles.matchInfo}>
                                        <div className={styles.matchName}>{m.b.name}</div>
                                        <div className={styles.matchBrand}>{m.b.brand}</div>
                                      </div>
                                    </div>
                                    <div className={styles.mixPaint}>
                                      <span className={styles.mixFraction}>{pct(m.fractions[2])}</span>
                                      <div className={styles.matchInfo}>
                                        <div className={styles.matchName}>{m.c.name}</div>
                                        <div className={styles.matchBrand}>{m.c.brand}</div>
                                      </div>
                                    </div>
                                    <div className={styles.mixDe}>ΔE {m.dE.toFixed(1)}</div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Pro upsell */
                      <div className={styles.proUpsell}>
                        <p className={styles.proUpsellText}>
                          Unlock alternative mixes and 3-paint combinations in the native app.
                        </p>
                        <button
                          type="button"
                          className={styles.modalClose}
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          Learn more
                        </button>
                      </div>
                    )}
                  </>
                )}
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
