'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api, endpoints } from '@/lib/api'
import toast from 'react-hot-toast'
import { Heart, MessageCircle, Trash2, Edit } from 'lucide-react'
import { EditPost } from './EditPost'
import { CommentsSection } from './CommentsSection'

interface PostProps {
  post: {
    id: string
    content: string
    image?: string
    image_url?: string
    category: string
    author: {
      id: string
      username: string
      first_name: string
      last_name: string
    }
    like_count: number
    comment_count: number
    is_liked_by_user: boolean
    created_at: string
    comments?: any[]
  }
  onPostDeleted?: (postId: string) => void
  onPostUpdated?: () => void
}

export function Post({ post, onPostDeleted, onPostUpdated }: PostProps) {
  const { user, token } = useAuth()
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [comment, setComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const isAuthor = user?.id === post.author.id

  const handleLike = async () => {
    if (!token) {
      toast.error('You must be logged in to like posts')
      return
    }

    try {
      if (isLiked) {
        await api.delete(`/posts/${post.id}/like/`)
        setLikeCount(prev => prev - 1)
        setIsLiked(false)
      } else {
        await api.post(`/posts/${post.id}/like/`)
        setLikeCount(prev => prev + 1)
        setIsLiked(true)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update like'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    setIsDeleting(true)
    try {
             await api.delete(`/posts/${post.id}/`)
       toast.success('Post deleted successfully')
       onPostDeleted?.(post.id)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete post'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleComment = async () => {
    if (!comment.trim() || !token) return

    setIsSubmittingComment(true)
    try {
      await api.post(`/posts/${post.id}/comments/`, { content: comment })
      toast.success('Comment added successfully')
      setComment('')
      setShowCommentForm(false)
      onPostUpdated?.()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add comment'
      toast.error(errorMessage)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await api.delete(endpoints.posts.deleteComment(commentId))
      toast.success('Comment deleted successfully')
      onPostUpdated?.()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete comment'
      toast.error(errorMessage)
    }
  }

  const handleCommentFormToggle = () => {
    setShowCommentForm(!showCommentForm)
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

  if (isEditing) {
    return (
      <EditPost
        post={post}
        onPostUpdated={() => {
          setIsEditing(false)
          onPostUpdated?.()
        }}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {post.author.first_name[0]}{post.author.last_name[0]}
            </span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {post.author.first_name} {post.author.last_name}
            </div>
            <div className="text-sm text-gray-500">
              @{post.author.username} • {formatDate(post.created_at)}
            </div>
          </div>
        </div>
        
        {isAuthor && (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              title="Edit post"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Delete post"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-gray-900 mb-3">{post.content}</p>
        {(post.image || post.image_url) && (
          <img
            src={post.image || post.image_url}
            alt="Post image"
            className="w-full h-64 object-cover rounded-lg"
          />
        )}
        <div className="mt-2">
          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
            {post.category}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
          
          <button
            onClick={handleCommentFormToggle}
            className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <MessageCircle size={20} />
            <span>{post.comment_count}</span>
          </button>
        </div>
      </div>

      {showCommentForm && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleComment}
              disabled={!comment.trim() || isSubmittingComment}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingComment ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {showCommentForm && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <CommentsSection postId={post.id} />
        </div>
      )}
    </div>
  )
}
