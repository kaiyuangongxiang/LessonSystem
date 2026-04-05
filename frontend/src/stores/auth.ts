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
}

const STORAGE_KEY = 'lesson-prep-auth'

function loadState(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { token: '', role: '', profile: null }
  }

  try {
    return JSON.parse(raw) as AuthState
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return { token: '', role: '', profile: null }
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => loadState(),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: this.token,
          role: this.role,
          profile: this.profile,
        }),
      )
    },
    setAuth(payload: AuthState) {
      this.token = payload.token
      this.role = payload.role
      this.profile = payload.profile
      this.persist()
    },
    updateProfile(profile: UserProfile | null) {
      this.profile = profile
      this.persist()
    },
    logout() {
      this.token = ''
      this.role = ''
      this.profile = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
