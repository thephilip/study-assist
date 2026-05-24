import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { UpdateToast } from './components/UpdateToast'

function Root() {
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null)

  registerSW({
    onNeedRefresh() {
      setNeedsUpdate(true)
    },
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      setUpdateSW(() => async () => {
        await r?.update()
        window.location.reload()
      })
    },
  })

  return (
    <StrictMode>
      <App />
      {needsUpdate && (
        <UpdateToast
          onUpdate={() => updateSW?.()}
          onDismiss={() => setNeedsUpdate(false)}
        />
      )}
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
