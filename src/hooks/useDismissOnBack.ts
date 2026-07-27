import { useEffect, useRef } from 'react'

/**
 * Arms a history entry so a back navigation dismisses an overlay.
 *
 * Android's hardware/gesture back is the platform's universal "dismiss this".
 * Capacitor's BridgeActivity routes it to WebView history, so pushing an entry
 * while an overlay is open turns back into a close — with no plugin, and with
 * the same benefit for the PWA in Android Chrome.
 *
 * Split out of the hook so it can be exercised without a React renderer.
 * ponytail: one entry per overlay, no shared stack. Overlays in this app never
 * stack; the `popped` guard keeps a stray entry from leaking if they ever do.
 */
export function armDismissOnBack(
  onDismiss: () => void,
  win: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
  hist: Pick<History, 'pushState' | 'back' | 'state'> = history,
): () => void {
  // Marked so a back that lands here is known to be ours, not a real route.
  hist.pushState({ overlay: true }, '')
  let popped = false

  const handler = () => {
    popped = true
    onDismiss()
  }
  win.addEventListener('popstate', handler)

  return () => {
    win.removeEventListener('popstate', handler)
    // Closed some other way (Escape, backdrop, selection): drop our entry so
    // the next back doesn't have to eat a no-op before leaving the app.
    if (!popped && hist.state?.overlay) hist.back()
  }
}

export function useDismissOnBack(open: boolean, onDismiss: () => void) {
  const dismiss = useRef(onDismiss)
  dismiss.current = onDismiss

  useEffect(() => {
    if (!open) return
    return armDismissOnBack(() => dismiss.current())
  }, [open])
}
