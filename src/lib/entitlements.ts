import { FREE_BRANDS, ALL_BRANDS, type Brand } from '@/lib/pigments'

const BRAND_STORAGE_KEY = 'unlockedBrands'
const FEATURE_STORAGE_KEY = 'unlockedFeatures'

export type ProFeature = 'pro-mix'

const ALL_PRO_FEATURES: ProFeature[] = ['pro-mix']

// ── Brand gating ────────────────────────────────────────────────────────────

function getStoredBrands(): Brand[] {
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Brand[]) : []
  } catch {
    return []
  }
}

export function isBrandUnlocked(brand: Brand): boolean {
  if (import.meta.env.VITE_PAID_BUILD === 'true') return true
  return FREE_BRANDS.includes(brand) || getStoredBrands().includes(brand)
}

export function unlockBrand(brand: Brand): void {
  const current = getStoredBrands()
  if (!current.includes(brand)) {
    localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify([...current, brand]))
  }
}

export function getUnlockedBrands(): Brand[] {
  if (import.meta.env.VITE_PAID_BUILD === 'true') return [...ALL_BRANDS]
  const stored = getStoredBrands()
  const extra = stored.filter(b => !FREE_BRANDS.includes(b))
  return [...FREE_BRANDS, ...extra]
}

// ── Feature gating (honest fence) ───────────────────────────────────────────
// Uses the same localStorage pattern as brand gating. The unlock script
// (docs/unlock-key.html) provides a convenient way to enable these.
// Proper IAP verification will come with the native apps (Phase 2).

function getStoredFeatures(): ProFeature[] {
  try {
    const raw = localStorage.getItem(FEATURE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProFeature[]) : []
  } catch {
    return []
  }
}

/** Returns true if the user has unlocked this Pro feature. */
export function isFeatureUnlocked(feature: ProFeature): boolean {
  if (import.meta.env.VITE_PAID_BUILD === 'true') return true
  return getStoredFeatures().includes(feature)
}

/** Unlocks a Pro feature via localStorage. Used by the unlock-key script. */
export function unlockFeature(feature: ProFeature): void {
  const current = getStoredFeatures()
  if (!current.includes(feature)) {
    localStorage.setItem(FEATURE_STORAGE_KEY, JSON.stringify([...current, feature]))
  }
}

/** Unlocks all Pro features at once. Used by the unlock-key script. */
export function unlockAllFeatures(): void {
  localStorage.setItem(FEATURE_STORAGE_KEY, JSON.stringify(ALL_PRO_FEATURES))
}

// Change these to whatever codes you want to distribute.
const VALID_CODES = new Set(['STUDYPRO'])

/** Validates and redeems an unlock code. Returns true if the code was valid. */
export function redeemCode(raw: string): boolean {
  if (!VALID_CODES.has(raw.trim().toUpperCase())) return false
  unlockAll()
  return true
}

/** Unlocks all brands + features at once. Used by the unlock-key script. */
export function unlockAll(): void {
  unlockAllFeatures()
  const allBrands = ['W&N', 'Williamsburg', 'Rembrandt', 'Utrecht', 'Geneva'] as Brand[]
  localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(allBrands))
}
