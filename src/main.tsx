import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { UpdateToast } from './components/UpdateToast'

// Called once at module load — outside any React component
let _notifyUpdate: (() => void) | undefined

const triggerUpdate = registerSW({
  onNeedRefresh() {
    _notifyUpdate?.()
  },
})

function Root() {
  const [needsUpdate, setNeedsUpdate] = useState(false)

  // Wire up the module-level callback to React state
  _notifyUpdate = () => setNeedsUpdate(true)

  return (
    <StrictMode>
      <App />
      {needsUpdate && (
        <UpdateToast
          onUpdate={() => triggerUpdate(true)}
          onDismiss={() => setNeedsUpdate(false)}
        />
      )}
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
