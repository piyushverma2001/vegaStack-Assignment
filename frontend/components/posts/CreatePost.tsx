'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Image, X } from 'lucide-react'

const createPostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(280, 'Post content cannot exceed 280 characters'),
  category: z.enum(['general', 'announcement', 'question']).default('general'),
})

type CreatePostData = z.infer<typeof createPostSchema>

interface CreatePostProps {
  onPostCreated: () => void
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { token } = useAuth()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePostData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: '',
      category: 'general',
    },
  })

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

  const onSubmit = async (data: CreatePostData) => {
    if (!token) {
      toast.error('You must be logged in to create posts')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('content', data.content)
      formData.append('category', data.category)
      
      if (selectedImage) {
        formData.append('image', selectedImage)
      } else {
        console.log('No image selected for upload')
      }

      const response = await api.post('/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
            
      toast.success('Post created successfully!')
      reset()
      setSelectedImage(null)
      setImagePreview(null)
      onPostCreated()
    } catch (error: any) {
      console.error('Post creation error:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to create post'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create a Post</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            What's on your mind?
          </label>
          <textarea
            {...register('content')}
            id="content"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Share your thoughts..."
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            {...register('category')}
            id="category"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="general">General</option>
            <option value="announcement">Announcement</option>
            <option value="question">Question</option>
          </select>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Add Image (optional)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="image"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageSelect}
              className="hidden"
            />
            <label
              htmlFor="image"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Image className="h-4 w-4 mr-2" />
              Choose Image
            </label>
            {selectedImage && (
              <button
                type="button"
                onClick={removeImage}
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPEG, PNG. Maximum size: 2MB
          </p>
        </div>

        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2"
          >
            {isLoading ? 'Creating...' : 'Create Post'}
          </Button>
        </div>
      </form>
    </div>
  )
}
