import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { UpdateToast } from './components/UpdateToast'
import { ChangelogModal } from './components/ChangelogModal'
import { CURRENT_VERSION } from './lib/changelog'
import { applyVividLedgerEntitlements } from './lib/vl-bridge'

const SEEN_VERSION_KEY = 'lastSeenVersion'

// Fire-and-forget: on vividledger.art this unlocks Pro for signed-in members;
// everywhere else it returns immediately. Gated UIs mount after image load,
// well past this resolving, and the upgrade modal re-reads on unlock anyway.
applyVividLedgerEntitlements()

// Called once at module load — outside any React component
let _notifyUpdate: (() => void) | undefined

const triggerUpdate = registerSW({
  onNeedRefresh() {
    _notifyUpdate?.()
  },
})

function Root() {
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [confirmingUpdate, setConfirmingUpdate] = useState(false)
  const [hasImage, setHasImage] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)

  // Wire up the module-level callback to React state
  _notifyUpdate = () => setNeedsUpdate(true)

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_VERSION_KEY)
    if (seen === null) {
      // First visit — set silently, no modal
      localStorage.setItem(SEEN_VERSION_KEY, CURRENT_VERSION)
    } else if (seen !== CURRENT_VERSION) {
      setShowChangelog(true)
    }
  }, [])

  function handleUpdateRequest() {
    if (hasImage) {
      setConfirmingUpdate(true)
    } else {
      triggerUpdate(true)
    }
  }

  function dismissChangelog() {
    localStorage.setItem(SEEN_VERSION_KEY, CURRENT_VERSION)
    setShowChangelog(false)
  }

  return (
    <StrictMode>
      <App onImageChange={setHasImage} />
      {needsUpdate && (
        <UpdateToast
          confirming={confirmingUpdate}
          onUpdate={handleUpdateRequest}
          onConfirm={() => triggerUpdate(true)}
          onCancelConfirm={() => setConfirmingUpdate(false)}
          onDismiss={() => { setNeedsUpdate(false); setConfirmingUpdate(false) }}
        />
      )}
      {showChangelog && <ChangelogModal onDismiss={dismissChangelog} />}
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
