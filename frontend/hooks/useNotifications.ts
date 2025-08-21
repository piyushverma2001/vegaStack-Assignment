import { useState, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { api, endpoints } from '@/lib/api'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  sender: {
    username: string
    first_name: string
    last_name: string
  }
  notification_type: 'follow' | 'like' | 'comment'
  message: string
  is_read: boolean
  created_at: string
  post?: {
    id: string
  }
}

export function useNotifications() {
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)

  const fetchNotifications = async () => {
    if (!token) return

    try {
      setIsLoading(true)
      const response = await api.get('/notifications/')
      
      setNotifications(prev => {
        const newNotifications = response.data
        const existingIds = new Set(prev.map(n => n.id))
        
        const uniqueNewNotifications = newNotifications.filter((n: any) => !existingIds.has(n.id))
        
        if (uniqueNewNotifications.length !== newNotifications.length) {
          console.log('Filtered out duplicate notifications:', {
            total: newNotifications.length,
            unique: uniqueNewNotifications.length,
            duplicates: newNotifications.length - uniqueNewNotifications.length
          })
        }
        
        return [...uniqueNewNotifications, ...prev]
      })
      
      setUnreadCount(response.data.filter((n: Notification) => !n.is_read).length)
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read/`)
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: any) {
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error: any) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  useEffect(() => {
    if (user?.id && token) {
      const eventSource = new EventSource(endpoints.notifications.stream, {
        withCredentials: true
      })
      
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('Connected to notification stream')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('SSE notification received:', data)
          
          if (data.type === 'heartbeat') {
            setUnreadCount(data.unread_count)
          } else if (data.type === 'connection') {
            console.log('SSE connection established')
          } else if (data.type === 'new_notification') {
            const newNotification = data.notification
            setNotifications(prev => {
              const exists = prev.some(n => n.id === newNotification.id)
              if (exists) {
                console.log('Notification already exists, skipping:', newNotification.id)
                return prev
              }
              console.log('Adding new notification:', newNotification.id)
              return [newNotification, ...prev]
            })
            setUnreadCount(prev => prev + 1)
            
            console.log('New notification received:', newNotification)
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        eventSource.close()
      }

      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
        }
      }
    }
  }, [user?.id, token])

  useEffect(() => {
    fetchNotifications()
  }, [token])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  }
}
