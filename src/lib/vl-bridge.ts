// VividLedger entitlement bridge.
//
// When the app is served from vividledger.art (the /studio deployment), a
// signed-in VividLedger artist gets Pro unlocked automatically: we read the
// VL session token (same-origin localStorage) and ask the VL backend to
// confirm membership. On every other host this module does nothing.
//
// ponytail: unlocks persist in localStorage after a successful check — no
// re-validation or lapse handling until VL ships subscription billing.

import { unlockAll } from '@/lib/entitlements'

const VL_TOKEN_KEY = 'vl.session.token'

export function isVividLedgerHost(): boolean {
  return location.hostname === 'vividledger.art' || location.hostname === 'www.vividledger.art'
}

/** Resolves once membership has been checked (or immediately off-VL). */
export async function applyVividLedgerEntitlements(): Promise<void> {
  if (!isVividLedgerHost()) return
  const token = localStorage.getItem(VL_TOKEN_KEY)
  if (!token) return
  try {
    const res = await fetch('/api/studio/entitlements', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1500),
    })
    if (!res.ok) return
    const body = await res.json()
    if (body?.ok && body?.data?.unlocked) unlockAll()
  } catch {
    // Offline or VL API down — fall back to whatever is already unlocked
  }
}
