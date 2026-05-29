import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Panel } from '@/components/Panel'
import { Slider } from '@/components/Slider'
import { drawImageToCanvas, getPixelData } from '@/lib/canvas'
import { rgbToHex, rgbToLab, type RGB } from '@/lib/color'
import { sampleRegion } from './color-picker'
import {
  PIGMENTS,
  ALL_BRANDS,
  findTopSingles,
  findBestMix,
  type Brand,
  type SingleMatch,
  type MixMatch,
} from '@/lib/pigments'
import { isBrandUnlocked, getUnlockedBrands } from '@/lib/entitlements'
import { generateHarmonies, isAchromatic } from './harmonies'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap, useZoom } from '@/components/CanvasWrap'
import { UpgradeModal } from '@/components/UpgradeModal'
import toolStyles from './Tool.module.css'
import styles from './ColourStudio.module.css'

// ── Types ──────────────────────────────────────────────────────────

type PaletteResult = { colors: RGB[]; sizes: number[] }

type SelectedColour =
  | { source: 'palette'; index: number; color: RGB; hex: string; pct: number }
  | { source: 'sample'; color: RGB; hex: string }
  | null

// ── Brand display names ────────────────────────────────────────────

const BRAND_SHORT: Record<Brand, string> = {
  Gamblin:     'Gamblin',
  'W&N':       'W&N',
  Williamsburg:'Wmsburg',
  Rembrandt:   'Rembdt',
  Utrecht:     'Utrecht',
  Geneva:      'Geneva',
}

function hexFromRGB(color: RGB): string {
  return rgbToHex(color)
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

// ── Component ──────────────────────────────────────────────────────

type Props = { image: LoadedImage }

export function ColourStudio({ image }: Props) {
  // ── Refs ──────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageDataRef = useRef<ImageData | null>(null)

  // ── State ─────────────────────────────────────────────────────────
  const [k, setK] = useState(6)
  const [result, setResult] = useState<PaletteResult | null>(null)
  const [running, setRunning] = useState(false)
  const [runId, setRunId] = useState(0)
  const [selected, setSelected] = useState<SelectedColour>(null)
  const [pickPos, setPickPos] = useState<{ x: number; y: number } | null>(null)
  const [activeBrands, setActiveBrands] = useState<Set<Brand>>(new Set(getUnlockedBrands()))
  const [matchPigments, setMatchPigments] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { scale } = useZoom()

  // ── Draw image + extract ImageData ────────────────────────────────
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
    setResult(null)
    setSelected(null)
    setPickPos(null)
  }, [image])

  // ── Run K-means worker ───────────────────────────────────────────
  useEffect(() => {
    const data = imageDataRef.current
    if (!data) return
    setRunning(true)
    const buffer = data.data.buffer.slice(0)
    const worker = new Worker(
      new URL('../workers/kmeans.worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.postMessage({ buffer, width: data.width, height: data.height, k }, [buffer])
    worker.onmessage = (e: MessageEvent<PaletteResult>) => {
      setResult(e.data)
      setRunning(false)
      worker.terminate()
    }
    return () => { worker.terminate() }
  }, [image, k, runId])

  // ── Canvas click handler ──────────────────────────────────────────
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
    setSelected({ source: 'sample', color, hex: hexFromRGB(color) })
    setPickPos({ x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale })
  }, [scale])

  // ── Palette swatch click ──────────────────────────────────────────
  const handleSwatchClick = useCallback((index: number, color: RGB) => {
    if (!result) return
    const size = result.sizes[index]
    setSelected({
      source: 'palette',
      index,
      color,
      hex: hexFromRGB(color),
      pct: Math.round(size * 100),
    })
    setPickPos(null)
  }, [result])

  // ── Brand toggle ──────────────────────────────────────────────────
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

  // ── Filtered paints ───────────────────────────────────────────────
  const filteredPaints = useMemo(
    () => PIGMENTS.filter(p => activeBrands.has(p.brand)),
    [activeBrands],
  )

  // ── Closest paints for selected colour ────────────────────────────
  const paintResults = useMemo<{ singles: SingleMatch[]; bestMix: MixMatch | null } | null>(() => {
    if (!selected) return null
    const target = rgbToLab(selected.color)
    return {
      singles: findTopSingles(target, filteredPaints, 3),
      bestMix: findBestMix(target, filteredPaints),
    }
  }, [selected, filteredPaints])

  // ── Harmony schemes for selected colour ───────────────────────────
  const allSchemes = useMemo(() => {
    if (!selected) return null
    return generateHarmonies(selected.color)
  }, [selected])

  // ── Pigment matches for harmony colours ──────────────────────────
  const harmonyPigmentMatches = useMemo<Record<string, SingleMatch | null> | null>(() => {
    if (!matchPigments || !allSchemes || !selected) return null
    const result: Record<string, SingleMatch | null> = {}
    for (const scheme of allSchemes) {
      for (const color of scheme.colors) {
        const key = hexFromRGB(color)
        if (!result[key]) {
          const lab = rgbToLab(color)
          result[key] = findTopSingles(lab, filteredPaints, 1)[0] ?? null
        }
      }
    }
    return result
  }, [matchPigments, allSchemes, filteredPaints])

  // ── Achromatic hint ───────────────────────────────────────────────
  const achromatic = selected ? isAchromatic(selected.color) : false

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={toolStyles.root}>
      {/* ── Canvas (reference image, clickable) ─────────────────── */}
      <CanvasWrap>
        <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            className={toolStyles.canvas}
            role="img"
            aria-label="Reference image — click to sample a colour"
            style={{ cursor: 'crosshair' }}
            onPointerUp={handlePointerUp}
          />
          {pickPos && selected && selected.source === 'sample' && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: pickPos.x,
                top: pickPos.y,
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

      {/* ── Controls Panel ──────────────────────────────────────── */}
      <Panel className={toolStyles.controls} toolSlug="colour-studio">
        {/* Header */}
        <h2 className={toolStyles.toolName}>Colour Studio</h2>
        <p className={toolStyles.description}>
          Extract palette swatches, find paint matches, and generate harmonic colour schemes — all in one view.
        </p>

        {/* ── Palette Settings ─────────────────────────────────────── */}
        <div className={styles.section}>
          <Slider label="Colours" value={k} min={2} max={12} onChange={setK} />
          <button
            className={styles.rerun}
            onClick={() => setRunId(id => id + 1)}
            disabled={running}
          >
            {running ? 'Analysing…' : 'Re-run'}
          </button>
        </div>

        {/* ── Extracted Palette Swatches ──────────────────────────── */}
        {result && (
          <>
            {/* Proportional bar */}
            <div className={styles.swatchBar}>
              {result.colors.map((color, i) => {
                const hex = hexFromRGB(color)
                const active = selected?.source === 'palette' && selected.index === i
                return (
                  <button
                    key={i}
                    className={`${styles.swatchSegment} ${active ? styles.segmentActive : ''}`}
                    style={{ background: hex, flexGrow: result.sizes[i] }}
                    onClick={() => handleSwatchClick(i, color)}
                    title={hex}
                    aria-label={`${hex} — ${Math.round(result.sizes[i] * 100)}%`}
                  >
                    <span className={styles.segmentLabel}>{hex}</span>
                  </button>
                )
              })}
            </div>

            {/* Detail list */}
            <div className={styles.list}>
              {result.colors.map((color, i) => {
                const hex = hexFromRGB(color)
                const active = selected?.source === 'palette' && selected.index === i
                return (
                  <button
                    key={i}
                    className={`${styles.row} ${active ? styles.rowActive : ''}`}
                    onClick={() => handleSwatchClick(i, color)}
                  >
                    <div className={styles.dot} style={{ background: hex }} />
                  <span className={styles.hex}>{hex}</span>
                  <span className={styles.pct}>{pct(result.sizes[i])}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Prompt when no selection */}
        {result && !selected && (
          <p className={styles.prompt}>
            Click a swatch or tap the image to see paint matches and harmonies.
          </p>
        )}

        {!result && (
          <p className={styles.prompt} aria-live="polite">
            {running ? 'Analysing…' : ''}
          </p>
        )}

        {/* ── Selected Colour Detail ───────────────────────────────── */}
        {selected && (
          <>
            <hr className={styles.divider} />

            {/* Colour preview */}
            <div className={styles.selectedSwatch} style={{ background: selected.hex }} />
            <div className={styles.selectedMeta}>
              <button
                className={styles.selectedHex}
                onClick={() => navigator.clipboard.writeText(selected.hex)}
                aria-label={`Copy ${selected.hex}`}
                title="Click to copy"
              >
                {selected.hex}
              </button>
              <span className={styles.selectedRgb}>
                {selected.color.r}, {selected.color.g}, {selected.color.b}
              </span>
            </div>

            {/* ── Closest Paints ────────────────────────────────────── */}
            {paintResults && (
              <>
                <p className={styles.sectionLabel}>Closest paints</p>
                {paintResults.singles.length === 0 ? (
                  <p className={styles.noResults}>No paints in selected brands.</p>
                ) : (
                  paintResults.singles.map(({ paint, dE }) => (
                    <div key={paint.id} className={styles.matchRow}>
                      <div
                        className={styles.matchSwatch}
                        style={{ background: hexFromRGB(paint.rgb) }}
                      />
                      <div className={styles.matchInfo}>
                        <div className={styles.matchName}>{paint.name}</div>
                        <div className={styles.matchMeta}>{paint.brand} · {paint.pigmentCode}</div>
                      </div>
                      <span className={styles.matchDe}>ΔE {dE.toFixed(1)}</span>
                    </div>
                  ))
                )}

                {/* Best 2-paint mix */}
                {paintResults.bestMix && (
                  <>
                    <p className={styles.sectionLabel}>Nearest mix</p>
                    <div className={styles.mixResult}>
                      <div className={styles.mixSwatches}>
                        <div
                          className={styles.mixSwatchA}
                          style={{ background: hexFromRGB(paintResults.bestMix.a.rgb), flex: paintResults.bestMix.aFraction }}
                        />
                        <div
                          className={styles.mixSwatchB}
                          style={{ background: hexFromRGB(paintResults.bestMix.b.rgb), flex: 1 - paintResults.bestMix.aFraction }}
                        />
                      </div>
                      <div className={styles.mixPaint}>
                        <span className={styles.mixFraction}>{pct(paintResults.bestMix.aFraction)}</span>
                        <div className={styles.matchInfo}>
                          <div className={styles.matchName}>{paintResults.bestMix.a.name}</div>
                          <div className={styles.matchMeta}>{paintResults.bestMix.a.brand}</div>
                        </div>
                      </div>
                      <div className={styles.mixPaint}>
                        <span className={styles.mixFraction}>{pct(1 - paintResults.bestMix.aFraction)}</span>
                        <div className={styles.matchInfo}>
                          <div className={styles.matchName}>{paintResults.bestMix.b.name}</div>
                          <div className={styles.matchMeta}>{paintResults.bestMix.b.brand}</div>
                        </div>
                      </div>
                      <div className={styles.mixDe}>ΔE {paintResults.bestMix.dE.toFixed(1)}</div>
                    </div>
                    <p className={styles.disclaimer}>
                      Mix ratios are LAB linear approximations — use as a starting point, not a precise formula.
                    </p>
                  </>
                )}
              </>
            )}

            {/* ── Harmony Schemes ────────────────────────────────────── */}
            {allSchemes && (
              <>
                <hr className={styles.divider} />
                <p className={styles.sectionLabel}>Harmonies</p>

                {/* Match to pigments toggle */}
                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={matchPigments}
                    onChange={e => setMatchPigments(e.target.checked)}
                    className={styles.toggleCheckbox}
                  />
                  <span className={styles.toggleLabel}>Match to pigments</span>
                </label>

                {/* Brand filter — only when matching is on */}
                {matchPigments && (
                  <div className={styles.brandRow}>
                    {ALL_BRANDS.map(brand => {
                      const free = isBrandUnlocked(brand)
                      const active = activeBrands.has(brand)
                      return (
                        <button
                          key={brand}
                          className={`${styles.brandBtn} ${active ? styles.active : ''} ${!free ? styles.locked : ''}`}
                          onClick={() => toggleBrand(brand)}
                          aria-pressed={free ? active : undefined}
                          aria-label={free ? brand : `${brand} — Pro brand pack`}
                        >
                          {BRAND_SHORT[brand]}
                          {!free && <span className={styles.lockIcon} aria-hidden>🔒</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Achromatic hint */}
                {achromatic && (
                  <p className={styles.achromaticHint}>
                    Near-grey colours produce mostly grey harmonies — try a more saturated colour.
                  </p>
                )}

                {/* All 5 schemes */}
                <div className={styles.schemesContainer}>
                  {allSchemes.map(scheme => (
                    <div key={scheme.type} className={styles.schemeGroup}>
                      <div className={styles.schemeRow}>
                        <span className={styles.schemeLabel}>{scheme.label}</span>
                        <div className={styles.schemeBar}>
                          {scheme.colors.map((color, i) => {
                            const hex = hexFromRGB(color)
                            return (
                              <button
                                key={i}
                                className={styles.schemeSwatch}
                                style={{ background: hex, flex: 1 }}
                                onClick={() => navigator.clipboard.writeText(hex)}
                                aria-label={`Copy ${hex}`}
                                title={hex}
                              />
                            )
                          })}
                        </div>
                      </div>
                      {/* Pigment names below bar */}
                      {matchPigments && harmonyPigmentMatches && (
                        <div className={styles.pigmentRow}>
                          {scheme.colors.map((color, i) => {
                            const hex = hexFromRGB(color)
                            const match = harmonyPigmentMatches[hex]
                            return (
                              <span key={i} className={styles.pigmentName}>
                                {match?.paint.name ?? '—'}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {showUpgradeModal && (
          <UpgradeModal
            title="Brand Packs"
            body="Additional brand packs are coming with the native app. The free tier includes the full Gamblin range."
            onClose={() => setShowUpgradeModal(false)}
            onUnlock={() => setActiveBrands(new Set(getUnlockedBrands()))}
          />
        )}
      </Panel>
    </div>
  )
}
