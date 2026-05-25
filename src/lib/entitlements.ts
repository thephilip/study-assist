import { FREE_BRANDS, type Brand } from '@/lib/pigments'

const STORAGE_KEY = 'unlockedBrands'

function getStoredUnlocks(): Brand[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Brand[]) : []
  } catch {
    return []
  }
}

export function isBrandUnlocked(brand: Brand): boolean {
  return FREE_BRANDS.includes(brand) || getStoredUnlocks().includes(brand)
}

export function unlockBrand(brand: Brand): void {
  const current = getStoredUnlocks()
  if (!current.includes(brand)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, brand]))
  }
}

export function getUnlockedBrands(): Brand[] {
  const stored = getStoredUnlocks()
  const extra = stored.filter(b => !FREE_BRANDS.includes(b))
  return [...FREE_BRANDS, ...extra]
}
