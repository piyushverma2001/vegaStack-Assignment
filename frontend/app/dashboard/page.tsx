'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Feed } from '@/components/feed/Feed'
import { UserProfile } from '@/components/users/UserProfile'
import { Navigation } from '@/components/navigation/Navigation'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { DiscoverUsers } from '@/components/users/DiscoverUsers'
import { UserSettings } from '@/components/users/UserSettings'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, restoreAuth } = useAuth()
  const router = useRouter()
  const [activeView, setActiveView] = useState('feed')

  useEffect(() => {
    restoreAuth()
  }, [restoreAuth])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const renderContent = () => {
    switch (activeView) {
      case 'feed':
        return <Feed />
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto">
            <UserProfile />
          </div>
        )
      case 'discover':
        return <DiscoverUsers />
      case 'settings':
        return <UserSettings />
      case 'admin':
        return user?.is_staff ? (
          <AdminDashboard />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to access the admin panel.</p>
          </div>
        )
      default:
        return <Feed />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeView={activeView} onViewChange={setActiveView} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeView === 'feed' && (
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Welcome back, {user?.first_name}!
            </h1>
          )}
          
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
