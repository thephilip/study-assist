import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Panel } from '@/components/Panel'
import { drawImageToCanvas, getPixelData } from '@/lib/canvas'
import { rgbToLab, rgbToHex, hexToRgb, type RGB } from '@/lib/color'
import { sampleRegion } from './color-picker'
import { PIGMENTS, ALL_BRANDS, findTopSingles, type Brand, type SingleMatch } from '@/lib/pigments'
import { isBrandUnlocked, getUnlockedBrands } from '@/lib/entitlements'
import {
  generateHarmonies,
  isAchromatic,
  type HarmonyType,
} from './harmonies'
import type { LoadedImage } from '@/hooks/useImage'
import { CanvasWrap, useZoom } from '@/components/CanvasWrap'
import { UpgradeModal } from '@/components/UpgradeModal'
import toolStyles from './Tool.module.css'
import styles from './Harmonies.module.css'

type Props = { image: LoadedImage }

const BRAND_SHORT: Record<Brand, string> = {
  Gamblin:     'Gamblin',
  'W&N':       'W&N',
  Williamsburg: 'Wmsburg',
  Rembrandt:   'Rembdt',
  Utrecht:     'Utrecht',
  Geneva:      'Geneva',
}

const HARMONY_TYPES: { type: HarmonyType; label: string }[] = [
  { type: 'complementary',        label: 'Complementary' },
  { type: 'analogous',            label: 'Analogous' },
  { type: 'triadic',              label: 'Triadic' },
  { type: 'split-complementary',  label: 'Split' },
  { type: 'tetradic',             label: 'Tetradic' },
]

function hexFromRGB(color: RGB): string {
  return rgbToHex(color)
}

export function ColorHarmonies({ image }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageDataRef = useRef<ImageData | null>(null)
  const [baseColor, setBaseColor] = useState<RGB>({ r: 128, g: 128, b: 128 })
  const [activeType, setActiveType] = useState<HarmonyType>('complementary')
  const [matchPigments, setMatchPigments] = useState(true)
  const [activeBrands, setActiveBrands] = useState<Set<Brand>>(new Set(getUnlockedBrands()))
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  useZoom()

  // ── Draw image once ──────────────────────────────────────────────────────

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

  // ── Sample colour from image ─────────────────────────────────────────────

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
    setBaseColor(color)
  }, [])

  // ── Colour input ─────────────────────────────────────────────────────────

  const handleColorInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseColor(hexToRgb(e.target.value))
  }, [])

  // ── Generate harmonies ───────────────────────────────────────────────────

  const allSchemes = useMemo(() => generateHarmonies(baseColor), [baseColor])
  const activeScheme = allSchemes.find(s => s.type === activeType)!
  const achromatic = isAchromatic(baseColor)

  // ── Pigment matching ─────────────────────────────────────────────────────

  const filteredPaints = useMemo(
    () => PIGMENTS.filter(p => activeBrands.has(p.brand)),
    [activeBrands],
  )

  const pigmentMatches = useMemo<Record<string, SingleMatch | null> | null>(() => {
    if (!matchPigments) return null
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

  // ── Brand toggle ─────────────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────

  const baseHex = hexFromRGB(baseColor)

  return (
    <div className={toolStyles.root}>
      {/* Canvas for color sampling */}
      <CanvasWrap>
        <canvas
          ref={canvasRef}
          className={toolStyles.canvas}
          role="img"
          aria-label="Reference image — click to sample a base colour"
          style={{ cursor: 'crosshair' }}
          onPointerUp={handlePointerUp}
        />
      </CanvasWrap>

      <Panel className={toolStyles.controls} toolSlug="harmonies">
        <h2 className={toolStyles.toolName}>Color Harmonies</h2>
        <p className={toolStyles.description}>
          Pick a base colour to generate harmonic colour schemes. Click the image or use the colour picker.
        </p>

        {/* ── Base colour ──────────────────────────────────────────────── */}
        <div className={styles.baseSection}>
          <div className={styles.basePreview} style={{ background: baseHex }}>
            <input
              type="color"
              value={baseHex}
              onChange={handleColorInput}
              className={styles.colorInput}
              aria-label="Base colour picker"
              title="Pick a base colour"
            />
          </div>
          <div className={styles.baseMeta}>
            <button
              className={styles.hexCopy}
              onClick={() => navigator.clipboard.writeText(baseHex)}
              aria-label={`Copy ${baseHex}`}
              title="Click to copy"
            >
              {baseHex}
            </button>
            <span className={styles.baseHint}>or click the image</span>
          </div>
        </div>

        {achromatic && (
          <p className={styles.achromaticHint}>
            Near-grey colours produce mostly grey harmonies — try a more saturated base colour.
          </p>
        )}

        {/* ── Harmony type selector ────────────────────────────────────── */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Scheme</span>
          <div className={styles.typeGrid}>
            {HARMONY_TYPES.map(({ type, label }) => (
              <button
                key={type}
                type="button"
                className={`${styles.typeBtn} ${activeType === type ? styles.active : ''}`}
                onClick={() => setActiveType(type)}
                aria-pressed={activeType === type}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Active harmony swatches ──────────────────────────────────── */}
        <div className={styles.schemePreview}>
          <div className={styles.swatchBar}>
            {activeScheme.colors.map((color, i) => {
              const hex = hexFromRGB(color)
              return (
                <div
                  key={i}
                  className={styles.swatch}
                  style={{ background: hex, flex: 1 }}
                >
                  <button
                    className={styles.swatchLabel}
                    onClick={() => navigator.clipboard.writeText(hex)}
                    aria-label={`Copy ${hex}`}
                    title={`${hex} — click to copy`}
                  >
                    {hex}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Pigment matching ──────────────────────────────────────────── */}
        <div className={styles.section}>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={matchPigments}
              onChange={e => setMatchPigments(e.target.checked)}
              className={styles.toggleCheckbox}
            />
            <span className={styles.toggleLabel}>Match to pigments</span>
          </label>
        </div>

        {matchPigments && (
          <>
            {/* Brand filter */}
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Brands</span>
              <div className={styles.brandRow}>
                {ALL_BRANDS.map(brand => {
                  const free = isBrandUnlocked(brand)
                  const active = activeBrands.has(brand)
                  return (
                    <button
                      key={brand}
                      type="button"
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
            </div>

            {/* Pigment match results */}
            {pigmentMatches && (
              <div className={styles.matches}>
                {activeScheme.colors.map((color, i) => {
                  const hex = hexFromRGB(color)
                  const match = pigmentMatches[hex]
                  return (
                    <div key={i} className={styles.matchRow}>
                      <div className={styles.matchDot} style={{ background: hex }} />
                      <div className={styles.matchInfo}>
                        <span className={styles.matchSwatchHex}>{hex}</span>
                        {match ? (
                          <>
                            <span className={styles.matchName}>{match.paint.name}</span>
                            <span className={styles.matchMeta}>
                              {match.paint.brand} · {match.paint.pigmentCode}
                            </span>
                          </>
                        ) : (
                          <span className={styles.matchNone}>No match</span>
                        )}
                      </div>
                      {match && (
                        <span className={styles.matchDe}>ΔE {match.dE.toFixed(1)}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {showUpgradeModal && (
          <UpgradeModal
            title="Brand Packs"
            body="Additional brand packs are coming with the native app. The free tier includes the full Gamblin range."
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </Panel>
    </div>
  )
}
