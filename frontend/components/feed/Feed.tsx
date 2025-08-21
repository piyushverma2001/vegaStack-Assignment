'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Post } from '@/components/posts/Post'
import { CreatePost } from '@/components/posts/CreatePost'
import toast from 'react-hot-toast'

interface FeedPost {
  id: string
  content: string
  author: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
  created_at: string
  like_count: number
  comment_count: number
  image_url?: string
  category: string
  is_liked_by_user: boolean

}

interface PaginationInfo {
  current_page: number
  total_pages: number
  total_posts: number
  posts_per_page: number
  has_next: boolean
  has_previous: boolean
  next_page: number | null
  previous_page: number | null
}

export function Feed() {
  const { token } = useAuth()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async (page: number = 1) => {
    if (!token) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get(`/posts/feed/?page=${page}`)
      setPosts(response.data.posts || response.data || [])
      setPagination(response.data.pagination || null)
      setCurrentPage(page)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load feed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts(1)
  }, [token])

  const handlePageChange = (page: number) => {
    fetchPosts(page)
  }

  const handlePostCreated = () => {
    fetchPosts(1)
  }

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(prev => prev.filter(post => post.id !== deletedPostId))
    if (posts.length === 1 && currentPage > 1) {
      fetchPosts(currentPage - 1)
    }
  }

  const handlePostUpdated = () => {
    fetchPosts(currentPage)
  }

  if (!token) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to SocialConnect</h2>
        <p className="text-gray-600">Please log in to see your personalized feed.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading your feed...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => fetchPosts(currentPage)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CreatePost onPostCreated={handlePostCreated} />
      
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h2>
          <p className="text-gray-600 mb-4">
            Your feed is empty. Start by following some users or create your first post!
          </p>
          <div className="text-sm text-gray-500">
            <p>• Follow users to see their posts in your feed</p>
            <p>• Create posts to share with your followers</p>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Feed</h2>
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
            />
          ))}
          
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.previous_page!)}
                disabled={!pagination.has_previous}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.next_page!)}
                disabled={!pagination.has_next}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
