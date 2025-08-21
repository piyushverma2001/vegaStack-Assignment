'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { ArrowLeft, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Following {
  id: string
  following: {
    id: string
    username: string
    first_name: string
    last_name: string
    profile?: {
      avatar_url: string
      bio: string
    }
  }
  created_at: string
}

interface FollowingListProps {
  userId: string
  username: string
  onClose: () => void
}

export function FollowingList({ userId, username, onClose }: FollowingListProps) {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [following, setFollowing] = useState<Following[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalFollowing, setTotalFollowing] = useState(0)

  useEffect(() => {
    fetchFollowing()
  }, [userId, currentPage])

  const fetchFollowing = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/users/${userId}/following/?page=${currentPage}`)
      
      if (currentPage === 1) {
        setFollowing(response.data.following)
      } else {
        setFollowing(prev => [...prev, ...response.data.following])
      }
      
      setHasNextPage(response.data.pagination.has_next)
      setTotalFollowing(response.data.total_following)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch following'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`)
    onClose()
  }

  const loadMore = () => {
    if (hasNextPage && !isLoading) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Following</h2>
              <p className="text-sm text-gray-500">@{username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <Users size={20} />
            <span className="text-sm font-medium">{totalFollowing}</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {isLoading && following.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading following...</div>
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <div className="text-gray-500 mb-2">Not following anyone yet</div>
              <p className="text-sm text-gray-400">When @{username} follows people, they'll appear here</p>
            </div>
          ) : (
            <div className="p-2">
              {following.map((follow) => (
                <div
                  key={follow.id}
                  onClick={() => handleUserClick(follow.following.id)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    {follow.following.profile?.avatar_url ? (
                      <img
                        src={follow.following.profile.avatar_url}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {follow.following.first_name[0]}{follow.following.last_name[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900 truncate">
                        {follow.following.first_name} {follow.following.last_name}
                      </p>
                      {follow.following.id === currentUser?.id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      @{follow.following.username}
                    </p>
                    {follow.following.profile?.bio && (
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {follow.following.profile.bio}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Following since {formatDate(follow.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {hasNextPage && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
