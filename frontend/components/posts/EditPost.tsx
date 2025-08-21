'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { X, Image } from 'lucide-react'

const editPostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(280, 'Post content cannot exceed 280 characters'),
  category: z.enum(['general', 'announcement', 'question']).default('general'),
})

type EditPostData = z.infer<typeof editPostSchema>

interface EditPostProps {
  post: {
    id: string
    content: string
    image?: string
    image_url?: string
    category: string
  }
  onPostUpdated: () => void
  onCancel: () => void
}

export function EditPost({ post, onPostUpdated, onCancel }: EditPostProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { token } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditPostData>({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      content: post.content,
      category: post.category,
    },
  })

  useEffect(() => {
    if (post.image_url) {
      setImagePreview(post.image_url)
    }
  }, [post.image_url])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB')
        return
      }
      
      setSelectedImage(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const onSubmit = async (data: EditPostData) => {
    if (!token) {
      toast.error('You must be logged in to edit posts')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('content', data.content)
      formData.append('category', data.category)
      
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      const response = await api.put(`/posts/${post.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      toast.success('Post updated successfully!')
      onPostUpdated()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update post'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Post</h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
            What's on your mind?
          </label>
          <textarea
            {...register('content')}
            id="edit-content"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Share your thoughts..."
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="edit-image" className="block text-sm font-medium text-gray-700 mb-1">
            Image (optional)
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              id="edit-image"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => document.getElementById('edit-image')?.click()}
              className="px-4 py-2"
            >
              {selectedImage ? 'Change Image' : 'Select Image'}
            </Button>
            {imagePreview && (
              <div className="relative w-16 h-16 rounded-md overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  title="Remove Image"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            {...register('category')}
            id="edit-category"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="general">General</option>
            <option value="announcement">Announcement</option>
            <option value="question">Question</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2"
          >
            {isLoading ? 'Updating...' : 'Update Post'}
          </Button>
        </div>
      </form>
    </div>
  )
}

