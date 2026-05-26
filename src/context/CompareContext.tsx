import { createContext, useContext, useState, useCallback } from 'react'

type CompareContextValue = {
  compare: boolean
  toggleCompare: () => void
  resetCompare: () => void
}

const CompareContext = createContext<CompareContextValue>({
  compare: false,
  toggleCompare: () => {},
  resetCompare: () => {},
})

export const useCompareContext = () => useContext(CompareContext)

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compare, setCompare] = useState(false)
  const toggleCompare = useCallback(() => setCompare(v => !v), [])
  const resetCompare = useCallback(() => setCompare(false), [])

  return (
    <CompareContext.Provider value={{ compare, toggleCompare, resetCompare }}>
      {children}
    </CompareContext.Provider>
  )
}
