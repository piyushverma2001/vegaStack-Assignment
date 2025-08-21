'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Users, FileText, MessageSquare, Heart, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface PlatformStats {
  users: {
    total: number
    active: number
    inactive: number
    admins: number
    regular: number
    new_this_week: number
    active_today: number
  }
  posts: {
    total: number
    today: number
    yesterday: number
  }
  date: {
    today: string
    yesterday: string
  }
}

interface ContentStats {
  posts: {
    total: number
    today: number
    yesterday: number
    this_week: number
  }
  comments: {
    total: number
    today: number
    yesterday: number
  }
  likes: {
    total: number
    today: number
  }
  top_creators: {
    posters: Array<{ author__username: string; post_count: number }>
    commenters: Array<{ author__username: string; comment_count: number }>
  }
}

export default function AdminStatsPage() {
  const { user } = useAuth()
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const [platformRes, contentRes] = await Promise.all([
        api.get('/admin/users/stats/'),
        api.get('/admin/posts/content-stats/')
      ])
      
      setPlatformStats(platformRes.data)
      setContentStats(contentRes.data)
    } catch (error: any) {
      toast.error('Failed to fetch statistics')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-lg">Loading statistics...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Statistics</h1>
          <p className="text-gray-600 mt-2">Comprehensive overview of platform metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats?.users.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {platformStats?.users.active || 0} active, {platformStats?.users.inactive || 0} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats?.posts.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {platformStats?.posts.today || 0} today, {platformStats?.posts.yesterday || 0} yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats?.users.active_today || 0}</div>
              <p className="text-xs text-muted-foreground">
                Users logged in today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats?.users.new_this_week || 0}</div>
              <p className="text-xs text-muted-foreground">
                New registrations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Statistics
              </CardTitle>
              <CardDescription>Detailed user metrics and demographics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{platformStats?.users.active || 0}</div>
                  <div className="text-sm text-blue-600">Active Users</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{platformStats?.users.admins || 0}</div>
                  <div className="text-sm text-green-600">Admin Users</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{platformStats?.users.regular || 0}</div>
                  <div className="text-sm text-yellow-600">Regular Users</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{platformStats?.users.inactive || 0}</div>
                  <div className="text-sm text-red-600">Inactive Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Content Statistics
              </CardTitle>
              <CardDescription>Post and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{contentStats?.posts.total || 0}</div>
                  <div className="text-sm text-purple-600">Total Posts</div>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{contentStats?.comments.total || 0}</div>
                  <div className="text-sm text-indigo-600">Total Comments</div>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{contentStats?.likes.total || 0}</div>
                  <div className="text-sm text-pink-600">Total Likes</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{contentStats?.posts.this_week || 0}</div>
                  <div className="text-sm text-orange-600">Posts This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Top Content Creators
              </CardTitle>
              <CardDescription>Users with most posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentStats?.top_creators.posters.slice(0, 5).map((poster, index) => (
                  <div key={poster.author__username} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">@{poster.author__username}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {poster.post_count} posts
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Top Commenters
              </CardTitle>
              <CardDescription>Users with most comments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentStats?.top_creators.commenters.slice(0, 5).map((commenter, index) => (
                  <div key={commenter.author__username} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">@{commenter.author__username}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {commenter.comment_count} comments
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>Today&apos;s platform activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{platformStats?.posts.today || 0}</div>
                  <div className="text-sm text-blue-600">Posts Today</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{contentStats?.comments.today || 0}</div>
                  <div className="text-sm text-green-600">Comments Today</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{contentStats?.likes.today || 0}</div>
                  <div className="text-sm text-purple-600">Likes Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

