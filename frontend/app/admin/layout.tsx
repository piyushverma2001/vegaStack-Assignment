'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Users, FileText, BarChart3, Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/')
    }
  }, [user, router])

  if (!user || user.role !== 'admin') {
    return null
  }

  const adminNavItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: Shield,
      description: 'Admin overview'
    },
    {
      title: 'User Management',
      href: '/admin/users',
      icon: Users,
      description: 'Manage users and roles'
    },
    {
      title: 'Content Management',
      href: '/admin/content',
      icon: FileText,
      description: 'Manage posts and comments'
    },
    {
      title: 'Statistics',
      href: '/admin/stats',
      icon: BarChart3,
      description: 'Platform analytics'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logged in as <span className="font-medium">{user.username}</span>
              </span>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {adminNavItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 py-4 px-2 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700 transition-colors"
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>


      <main>{children}</main>
    </div>
  )
}
