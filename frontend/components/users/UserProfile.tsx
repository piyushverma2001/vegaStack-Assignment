'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Users, FileText } from 'lucide-react'
import { Post } from '@/components/posts/Post'
import { FollowersList } from './FollowersList'
import { FollowingList } from './FollowingList'

interface UserProfileData {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  role: string
  is_verified: boolean
  created_at: string
      profile: {
      bio: string
      avatar_url: string
      website: string
      location: string
      privacy: 'public' | 'private' | 'followers_only'
      followers_count: number
      following_count: number
      posts_count: number
    }
}

interface UserProfileProps {
  userId?: string
}

export function UserProfile({ userId }: UserProfileProps) {
  const { user: currentUser, token } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  const targetUserId = userId || currentUser?.id || ''
  const isOwnProfile = currentUser?.id === targetUserId

  useEffect(() => {
    if (targetUserId) {
      fetchUserProfile()
      checkFollowStatus()
      fetchPosts()
    }
  }, [targetUserId, token])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get(`/users/${targetUserId}/`)
      setUserProfile(response.data)
      if (response.data.profile) {
        setFollowersCount(response.data.profile.followers_count || 0)
      } else {
        setFollowersCount(0)
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to load user profile'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      setPostsLoading(true)
      const response = await api.get(`/posts/?author=${targetUserId}`)
      setPosts(response.data.posts || response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch user posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  const checkFollowStatus = async () => {
    if (!token || isOwnProfile) return

    try {
      const response = await api.get(`/users/${targetUserId}/follow-status/`)
      setIsFollowing(response.data.is_following)
    } catch (error) {
      setIsFollowing(false)
    }
  }

  const handleFollow = async () => {
    if (!token) {
      toast.error('You must be logged in to follow users')
      return
    }

    try {
      if (isFollowing) {
        await api.delete(`/users/${targetUserId}/unfollow/`)
        setIsFollowing(false)
        setFollowersCount(prev => prev - 1)
        toast.success('Unfollowed successfully')
      } else {
        await api.post(`/users/${targetUserId}/follow/`)
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
        toast.success('Followed successfully')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update follow status'
      toast.error(errorMessage)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading profile...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchUserProfile}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">User not found</div>
      </div>
    )
  }

  if (!userProfile.profile) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Profile not found</div>
        <button
          onClick={fetchUserProfile}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    )
  }

  const profile = userProfile.profile || {
    bio: '',
    avatar_url: '',
    website: '',
    location: '',
    privacy: 'public',
    followers_count: 0,
    following_count: 0,
    posts_count: 0
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-3xl font-bold">
              {userProfile.first_name[0]}{userProfile.last_name[0]}
            </span>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {userProfile.first_name} {userProfile.last_name}
        </h1>
        
        <div className="text-gray-600 mb-2">
          @{userProfile.username}
          {userProfile.is_verified && (
            <span className="ml-2 text-blue-500">✓</span>
          )}
        </div>

        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            profile.privacy === 'public' 
              ? 'bg-green-100 text-green-800' 
              : profile.privacy === 'followers_only'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {profile.privacy === 'public' ? 'Public Profile' : 
             profile.privacy === 'followers_only' ? 'Followers Only' : 'Private Profile'}
          </span>
        </div>

        {!isOwnProfile && (
          <button
            onClick={handleFollow}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              isFollowing
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profile.posts_count}</div>
          <div className="text-sm text-gray-600">Posts</div>
        </div>
        <div 
          className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
          onClick={() => setShowFollowers(true)}
        >
          <div className="text-2xl font-bold text-gray-900">{followersCount}</div>
          <div className="text-sm text-gray-600">Followers</div>
        </div>
        <div 
          className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
          onClick={() => setShowFollowing(true)}
        >
          <div className="text-2xl font-bold text-gray-900">{profile.following_count}</div>
          <div className="text-sm text-gray-600">Following</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
          {profile.bio ? (
            <p className="text-gray-700">{profile.bio}</p>
          ) : (
            <p className="text-gray-500 italic">No bio added yet</p>
          )}
        </div>

        {(profile.website || profile.location) && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Contact & Location</h3>
            <div className="space-y-2">
              {profile.website && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">🌐</span>
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">📍</span>
                  <span className="text-gray-600">{profile.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Users size={16} className="text-gray-400" />
          <span className="text-gray-700">
            Member since {formatDate(userProfile.created_at)}
          </span>
        </div>
      </div>

      {isOwnProfile ? (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText size={20} className="mr-2" />
            Your Posts ({posts.length})
          </h3>
          
          {postsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading posts...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No posts yet</div>
              <p className="text-sm text-gray-400">Start sharing your thoughts with the world!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  onPostDeleted={(deletedPostId) => {
                    setPosts(prev => prev.filter(p => p.id !== deletedPostId))
                    fetchUserProfile() 
                  }}
                  onPostUpdated={() => {
                    fetchPosts()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText size={20} className="mr-2" />
            Posts ({posts.length})
          </h3>
          
          {profile.privacy === 'private' ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">This profile is private</div>
              <p className="text-sm text-gray-400">Posts are not visible to the public</p>
            </div>
          ) : profile.privacy === 'followers_only' && !isFollowing ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">Follow to see posts</div>
              <p className="text-sm text-gray-400">This user's posts are only visible to followers</p>
            </div>
          ) : (
            <>
              {postsLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">Loading posts...</div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No posts yet</div>
                  <p className="text-sm text-gray-400">This user hasn't shared anything yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Post
                      key={post.id}
                      post={post}
                      onPostDeleted={() => {
                      }}
                      onPostUpdated={() => {
                        fetchPosts()
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showFollowers && (
        <FollowersList
          userId={targetUserId}
          username={userProfile.username}
          onClose={() => setShowFollowers(false)}
        />
      )}

      {showFollowing && (
        <FollowingList
          userId={targetUserId}
          username={userProfile.username}
          onClose={() => setShowFollowing(false)}
        />
      )}
    </div>
  )
}

