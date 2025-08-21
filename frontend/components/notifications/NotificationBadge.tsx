'use client'

import { useNotifications } from '@/hooks/useNotifications'
import { Bell } from 'lucide-react'

interface NotificationBadgeProps {
  onClick?: () => void
  className?: string
}

export function NotificationBadge({ onClick, className = '' }: NotificationBadgeProps) {
  const { unreadCount } = useNotifications()

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
    >
      <Bell size={24} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
