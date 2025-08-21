'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  role: string
  is_staff: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (userData: any) => Promise<any>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearAuth: () => void
  restoreAuth: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null, 
      isAuthenticated: false,
      isLoading: true, 

      login: async (emailOrUsername: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/users/login/', {
            email_or_username: emailOrUsername,
            password,
          })

          const { user, access_token, refresh_token } = response.data
          
          set({
            user,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          })

          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          
        } catch (error) {
          console.error('Login failed:', error)
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/users/register/', userData)
          
          set({ isLoading: false })
          
          return response.data
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        
        if (refreshToken) {
          try {
            await api.post('/users/logout/', { refresh_token: refreshToken })
          } catch (error) {
            console.error('Failed to invalidate token on backend:', error)
          }
        }
        
        get().clearAuth()
        delete api.defaults.headers.common['Authorization']
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      restoreAuth: () => {
        const state = get()
        
        if (state.token && state.user) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
          set({ 
            isLoading: false,
            isAuthenticated: true,
            user: state.user,
            token: state.token,
            refreshToken: state.refreshToken
          })
        } else {
          set({ 
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
