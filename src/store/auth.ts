import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  sessionId: string | null
  accountId: number | null
  setSessionId: (sessionId: string | null) => void
  setAccountId: (accountId: number | null) => void
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      sessionId: null,
      accountId: null,
      isAuthenticated: false,
      setSessionId: (sessionId) =>
        set({ sessionId, isAuthenticated: !!sessionId }),
      setAccountId: (accountId) =>
        set({ accountId }),
    }),
    {
      name: 'auth-storage',
    }
  )
)