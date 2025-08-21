'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api, endpoints } from '@/lib/api'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
  created_at: string
}

interface CommentsSectionProps {
  postId: string
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { user, token } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchComments()
    }
  }, [token, postId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(endpoints.posts.comments(postId))
      
      let commentsData = []
      if (Array.isArray(response.data)) {
        commentsData = response.data
      } else if (response.data && Array.isArray(response.data.results)) {
        commentsData = response.data.results
      } else if (response.data && Array.isArray(response.data.comments)) {
        commentsData = response.data.comments
      }
      
      setComments(commentsData)
    } catch (error: any) {
      console.error('Failed to fetch comments:', error)
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await api.delete(endpoints.posts.deleteComment(commentId))
      toast.success('Comment deleted successfully')
      fetchComments()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete comment'
      toast.error(errorMessage)
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

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">Loading comments...</div>
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">No comments yet. Be the first to comment!</div>
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-3">Comments ({comments.length})</h4>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {comment.author.first_name[0]}{comment.author.last_name[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author.first_name} {comment.author.last_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  
                  {user?.id === comment.author.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
