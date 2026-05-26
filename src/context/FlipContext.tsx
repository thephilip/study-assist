import { createContext, useContext, useState, useCallback } from 'react'

type FlipState = { flipX: boolean; flipY: boolean }
type FlipContextValue = FlipState & {
  toggleFlipX: () => void
  toggleFlipY: () => void
  resetFlip: () => void
}

const FlipContext = createContext<FlipContextValue>({
  flipX: false, flipY: false,
  toggleFlipX: () => {}, toggleFlipY: () => {}, resetFlip: () => {},
})

export const useFlip = () => useContext(FlipContext)

export function FlipProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FlipState>({ flipX: false, flipY: false })

  const toggleFlipX = useCallback(() => setState(s => ({ ...s, flipX: !s.flipX })), [])
  const toggleFlipY = useCallback(() => setState(s => ({ ...s, flipY: !s.flipY })), [])
  const resetFlip = useCallback(() => setState({ flipX: false, flipY: false }), [])

  return (
    <FlipContext.Provider value={{ ...state, toggleFlipX, toggleFlipY, resetFlip }}>
      {children}
    </FlipContext.Provider>
  )
}
