'use client'

import { useEffect, useState } from 'react'
import { X, User, Heart, MessageCircle, Users } from 'lucide-react'

interface NotificationToastProps {
  notification: {
    id: string
    sender: {
      username: string
      first_name: string
      last_name: string
    }
    notification_type: 'follow' | 'like' | 'comment'
    message: string
    post?: {
      id: string
    }
  }
  onClose: () => void
  duration?: number
}

export function NotificationToast({ notification, onClose, duration = 5000 }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const getIcon = () => {
    switch (notification.notification_type) {
      case 'follow':
        return <Users size={20} className="text-blue-500" />
      case 'like':
        return <Heart size={20} className="text-red-500" />
      case 'comment':
        return <MessageCircle size={20} className="text-green-500" />
      default:
        return <User size={20} className="text-gray-500" />
    }
  }

  const getActionText = () => {
    switch (notification.notification_type) {
      case 'follow':
        return 'View Profile'
      case 'like':
      case 'comment':
        return 'View Post'
      default:
        return 'View'
    }
  }

  const handleAction = () => {
    if (notification.post?.id) {
      console.log('Navigate to post:', notification.post.id)
    } else if (notification.notification_type === 'follow') {
      console.log('Navigate to profile:', notification.sender.username)
    }
    handleClose()
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transform transition-all duration-300 ease-in-out">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {notification.sender.first_name} {notification.sender.last_name}
              </p>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleAction}
                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
              >
                {getActionText()}
              </button>
              
              <button
                onClick={handleClose}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

