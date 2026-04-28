import { defineStore } from 'pinia'

type UserRole = 'teacher' | 'admin' | 'student' | ''

interface UserProfile {
  id: number
  username: string
  name?: string | null
}

interface AuthState {
  token: string
  role: UserRole
  profile: UserProfile | null
  expiresAt: number
}

const STORAGE_KEY = 'lesson-prep-auth'

function createEmptyState(): AuthState {
  return { token: '', role: '', profile: null, expiresAt: 0 }
}

function isSessionExpired(expiresAt: number) {
  return !expiresAt || Date.now() >= expiresAt
}

function loadState(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return createEmptyState()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthState>
    const state: AuthState = {
      token: typeof parsed.token === 'string' ? parsed.token : '',
      role: parsed.role === 'teacher' || parsed.role === 'admin' || parsed.role === 'student' ? parsed.role : '',
      profile: parsed.profile || null,
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : 0,
    }

    if (!state.token || isSessionExpired(state.expiresAt)) {
      localStorage.removeItem(STORAGE_KEY)
      return createEmptyState()
    }

    return state
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return createEmptyState()
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => loadState(),
  getters: {
    isAuthenticated: (state) => Boolean(state.token) && !isSessionExpired(state.expiresAt),
  },
  actions: {
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: this.token,
          role: this.role,
          profile: this.profile,
          expiresAt: this.expiresAt,
        }),
      )
    },
    setAuth(payload: AuthState) {
      this.token = payload.token
      this.role = payload.role
      this.profile = payload.profile
      this.expiresAt = payload.expiresAt
      this.persist()
    },
    updateProfile(profile: UserProfile | null) {
      this.profile = profile
      this.persist()
    },
    ensureValidSession() {
      if (!this.token) {
        return false
      }

      if (isSessionExpired(this.expiresAt)) {
        this.logout()
        return false
      }

      return true
    },
    logout() {
      this.token = ''
      this.role = ''
      this.profile = null
      this.expiresAt = 0
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
