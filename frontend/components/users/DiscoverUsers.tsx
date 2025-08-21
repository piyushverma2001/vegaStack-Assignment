'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Search, UserPlus, Users, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  profile: {
    bio: string
    avatar_url?: string
    followers_count: number
    following_count: number
    posts_count: number
    privacy: 'public' | 'private' | 'followers_only'
  }
  is_following?: boolean
}

export function DiscoverUsers() {
  const { token } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (token) {
      fetchUsers()
    }
  }, [token])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/users/discover/')
      setUsers(response.data.users || response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await api.get(`/users/discover/?search=${encodeURIComponent(searchQuery)}`)
      const searchData = response.data.users || response.data || []
      setSearchResults(searchData)
    } catch (error: any) {
      console.error('Search failed:', error)
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.trim() === '') {
      setSearchResults([])
    }
  }

  const followUser = async (userId: string) => {
    try {
      const user = displayUsers.find(u => u.id === userId)
      if (!user) return

      if (user.is_following) {
        await api.delete(`/users/${userId}/unfollow/`)
        toast.success('User unfollowed successfully!')
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_following: false } : u))
        setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, is_following: false } : u))
      } else {
        await api.post(`/users/${userId}/follow/`)
        toast.success('User followed successfully!')
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_following: true } : u))
        setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, is_following: true } : u))
      }
    } catch (error: any) {
      toast.error('Failed to update follow status')
    }
  }

  const viewProfile = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const displayUsers = searchResults.length > 0 ? searchResults : users

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Discover Users</h2>
        <p className="text-gray-600">Find and connect with new people!</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                         <input
               type="text"
               placeholder="Search users by name or username..."
               value={searchQuery}
               onChange={handleSearchQueryChange}
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             />
          </div>
          <Button type="submit" className="px-6">
            Search
          </Button>
        </div>
      </form>

      {displayUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No users found' : 'No users to discover'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Check back later for new users to connect with!'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {user.first_name[0]}{user.last_name[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-gray-500">@{user.username}</p>
                </div>
              </div>

              {user.profile?.bio && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {user.profile.bio}
                </p>
              )}

              <div className="mb-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.profile?.privacy === 'public' 
                    ? 'bg-green-100 text-green-800' 
                    : user.profile?.privacy === 'followers_only'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.profile?.privacy === 'public' ? 'Public' : 
                   user.profile?.privacy === 'followers_only' ? 'Followers Only' : 'Private'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{user.profile?.posts_count || 0} posts</span>
                <span>{user.profile?.followers_count || 0} followers</span>
                <span>{user.profile?.following_count || 0} following</span>
              </div>

              <Button
                onClick={() => followUser(user.id)}
                className={`w-full ${user.is_following ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : ''}`}
                size="sm"
                variant={user.is_following ? 'outline' : 'default'}
              >
                {user.is_following ? (
                  <>
                    <Users size={16} className="mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="mr-2" />
                    Follow
                  </>
                )}
              </Button>

              <Button
                onClick={() => viewProfile(user.id)}
                variant="outline"
                size="sm"
                className="w-full mt-2"
              >
                <User size={16} className="mr-2" />
                View Profile
              </Button>
            </div>
          ))}
        </div>
      )}

      {searchQuery && (
        <div className="text-center mt-8">
          <Button
            onClick={() => {
              setSearchQuery('')
              setSearchResults([])
            }}
            variant="outline"
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  )
}
