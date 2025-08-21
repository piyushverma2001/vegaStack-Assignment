'use client'

import { Users, FileText, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user || user.role !== 'admin') {
    router.push('/')
    return null
  }

  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and account status',
      icon: Users,
      path: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Content Management',
      description: 'Manage posts, comments, and content',
      icon: FileText,
      path: '/admin/content',
      color: 'bg-green-500'
    },
    {
      title: 'Statistics',
      description: 'View platform analytics and insights',
      icon: BarChart3,
      path: '/admin/stats',
      color: 'bg-purple-500'
    }
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your platform and users</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminFeatures.map((feature) => {
            const IconComponent = feature.icon
            return (
              <Card 
                key={feature.title} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleNavigation(feature.path)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-3`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNavigation(feature.path)
                    }}
                  >
                    Access
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>


      </div>
    </div>
  )
}

