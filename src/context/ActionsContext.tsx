import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export interface ToolAction {
  id: string
  label: string
  handler: () => void
  checked?: boolean
  disabled?: boolean
  danger?: boolean
}

interface ActionsContextValue {
  globalActions: ToolAction[]
  contextualActions: ToolAction[]
  activeToolName: string | null
  registerToolActions: (toolName: string, actions: ToolAction[]) => void
  clearToolActions: (toolName: string) => void
}

const ActionsContext = createContext<ActionsContextValue>({
  globalActions: [],
  contextualActions: [],
  activeToolName: null,
  registerToolActions: () => {},
  clearToolActions: () => {},
})

export function ActionsProvider({
  children,
  globalActions = [],
}: {
  children: React.ReactNode
  globalActions?: ToolAction[]
}) {
  const [registration, setRegistration] = useState<{
    toolName: string
    actions: ToolAction[]
  } | null>(null)

  const registerToolActions = useCallback((toolName: string, actions: ToolAction[]) => {
    setRegistration({ toolName, actions })
  }, [])

  const clearToolActions = useCallback((toolName: string) => {
    setRegistration(prev => (prev?.toolName === toolName ? null : prev))
  }, [])

  const value = useMemo(
    () => ({
      globalActions,
      contextualActions: registration?.actions ?? [],
      activeToolName: registration?.toolName ?? null,
      registerToolActions,
      clearToolActions,
    }),
    [globalActions, registration, registerToolActions, clearToolActions],
  )

  return <ActionsContext.Provider value={value}>{children}</ActionsContext.Provider>
}

export const useActionsContext = () => useContext(ActionsContext)

// Pass a stable (useMemo'd) actions array — this hook re-registers whenever the reference changes.
export function useRegisterToolActions(toolName: string, actions: ToolAction[]) {
  const { registerToolActions, clearToolActions } = useActionsContext()
  useEffect(() => {
    registerToolActions(toolName, actions)
    return () => clearToolActions(toolName)
  }, [toolName, actions, registerToolActions, clearToolActions])
}
