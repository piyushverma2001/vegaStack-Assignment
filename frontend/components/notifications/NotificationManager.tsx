'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationToast } from './NotificationToast'

export function NotificationManager() {
  const { notifications } = useNotifications()
  const [activeToasts, setActiveToasts] = useState<Set<string>>(new Set())
  
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dismissedNotifications')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    }
    return new Set()
  })
  
  useEffect(() => {
    if (notifications.length > 0) {
      notifications.forEach(notification => {
        if (!activeToasts.has(notification.id) && !dismissedNotifications.has(notification.id)) {
          setActiveToasts(prev => new Set(prev).add(notification.id))
          
          setTimeout(() => {
            setActiveToasts(prev => {
              const newSet = new Set(prev)
              newSet.delete(notification.id)
              return newSet
            })
          }, 6000)
        }
      })
    }
  }, [notifications, activeToasts, dismissedNotifications])

  useEffect(() => {
    const cleanupTimer = setInterval(() => {
      setDismissedNotifications(new Set())
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dismissedNotifications')
      }
    }, 24 * 60 * 60 * 1000) // 24 hours

    return () => clearInterval(cleanupTimer)
  }, [])

  const handleToastClose = (notificationId: string) => {
    setActiveToasts(prev => {
      const newSet = new Set(prev)
      newSet.delete(notificationId)
      return newSet
    })
    
    setDismissedNotifications(prev => {
      const newSet = new Set(prev).add(notificationId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('dismissedNotifications', JSON.stringify(Array.from(newSet)))
      }
      return newSet
    })
  }

  const activeNotifications = notifications.filter(notification => activeToasts.has(notification.id))
  
  return (
    <>
      {activeNotifications
        .slice(0, 3)
        .map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => handleToastClose(notification.id)}
            duration={5000}
          />
        ))}
    </>
  )
}

