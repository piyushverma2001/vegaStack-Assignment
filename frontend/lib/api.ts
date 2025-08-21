import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const authData = JSON.parse(token)
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
        }
      } catch (error) {
        console.error('Error parsing auth token:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token first
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        try {
          const parsed = JSON.parse(authData)
          const refreshToken = parsed.state?.refreshToken
          
          if (refreshToken) {
            // Attempt token refresh
            const refreshResponse = await axios.post(
              `${API_URL}/users/token/refresh/`,
              { refresh: refreshToken }
            )
            
            if (refreshResponse.data.access) {
              // Update stored tokens
              const newAuthData = {
                ...parsed,
                state: {
                  ...parsed.state,
                  token: refreshResponse.data.access
                }
              }
              localStorage.setItem('auth-storage', JSON.stringify(newAuthData))
              
              // Retry original request with new token
              error.config.headers.Authorization = `Bearer ${refreshResponse.data.access}`
              return axios.request(error.config)
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }
      
      // If refresh failed or no refresh token, redirect to login
      localStorage.removeItem('auth-storage')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  auth: {
    login: '/users/login/',
    register: '/users/register/',
    logout: '/users/logout/',
    passwordReset: '/users/password-reset/',
    passwordResetConfirm: '/users/password-reset-confirm/',
    changePassword: '/users/change-password/',
    tokenRefresh: '/users/token/refresh/',
  },
  users: {
    profile: '/users/me/',
    list: '/users/',
    detail: (id: string) => `/users/${id}/`,
    follow: (id: string) => `/users/${id}/follow/`,
    unfollow: (id: string) => `/users/${id}/unfollow/`,
    followStatus: (id: string) => `/users/${id}/follow-status/`,
    followers: (id: string) => `/users/${id}/followers/`,
    following: (id: string) => `/users/${id}/following/`,
    avatarUpload: '/users/avatar-upload/',
    avatarRemove: '/users/avatar-remove/',
  },
  posts: {
    list: '/posts/',
    create: '/posts/',
    detail: (id: string) => `/posts/${id}/`,
    like: (id: string) => `/posts/${id}/like/`,
    likeStatus: (id: string) => `/posts/${id}/like-status/`,
    comments: (id: string) => `/posts/${id}/comments/`,
    createComment: (id: string) => `/posts/${id}/comments/create/`,
    deleteComment: (id: string) => `/posts/comments/${id}/`,
    feed: '/posts/feed/',
  },
  feed: {
    main: '/posts/feed/',
  },
  notifications: {
    list: '/notifications/',
    detail: (id: string) => `/notifications/${id}/`,
    markRead: (id: string) => `/notifications/${id}/read/`,
    markAllRead: '/notifications/mark-all-read/',
    unreadCount: '/notifications/unread-count/',
    stream: '/notifications/stream/',
  },
  admin: {
    users: '/admin/users/',
    posts: '/admin/posts/',
    stats: '/admin/stats/',
    userStats: '/admin/users/stats/',
    contentStats: '/admin/posts/content-stats/',
  },
}
