'use client'

import { useAuth } from '@/hooks/useAuth'
import { Home, User, Users, Settings, LogOut, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { NotificationsList } from '@/components/notifications/NotificationsList'

interface NavigationProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const navigationItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'discover', label: 'Discover', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const { user } = useAuth()
  if (user?.role === 'admin') {
    navigationItems.push({ id: 'admin', label: 'Admin', icon: Shield })
  }

  const handleNavigation = (viewId: string) => {
    if (viewId === 'admin') {
      router.push('/admin')
    } else {
      onViewChange(viewId)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">SocialConnect</h1>
            </div>
            
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationsList />
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
