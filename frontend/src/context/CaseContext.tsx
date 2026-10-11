import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

// ── CaseContext ────────────────────────────────────────────────────────────────
// Single source of truth for the "currently selected / active case".
// Persisted to localStorage so the active case survives page refreshes.
// All pages that need case_id read from this context — never hardcode it.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tatva_active_case_id'

interface CaseContextValue {
  activeCaseId: string | null
  setActiveCaseId: (id: string | null) => void
}

const CaseContext = createContext<CaseContextValue | null>(null)

export function CaseProvider({ children }: { children: ReactNode }) {
  const [activeCaseId, setActiveCaseIdState] = useState<string | null>(() => {
    // Hydrate from localStorage on first render
    try {
      return localStorage.getItem(STORAGE_KEY) ?? null
    } catch {
      return null
    }
  })

  // Persist every change to localStorage
  const setActiveCaseId = (id: string | null) => {
    setActiveCaseIdState(id)
    try {
      if (id === null) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, id)
      }
    } catch {
      // localStorage not available (private mode etc.) — continue without persistence
    }
  }

  return (
    <CaseContext.Provider value={{ activeCaseId, setActiveCaseId }}>
      {children}
    </CaseContext.Provider>
  )
}

/** Hook — throws if used outside <CaseProvider>. */
export function useCaseContext(): CaseContextValue {
  const ctx = useContext(CaseContext)
  if (!ctx) {
    throw new Error('useCaseContext must be used inside <CaseProvider>')
  }
  return ctx
}
