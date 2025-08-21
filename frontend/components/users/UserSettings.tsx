'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { User, Shield, Bell, Lock, Eye, EyeOff, Upload, X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { endpoints } from '@/lib/api'

interface SettingsData {
  user: {
    first_name: string
    last_name: string
    email: string
    username: string
  }
  profile: {
    bio: string
    avatar_url: string
    website: string
    location: string
    privacy: 'public' | 'private' | 'followers_only'
  }
  preferences: {
    email_notifications: boolean
    push_notifications: boolean
  }
}

export function UserSettings() {
  const { user, token } = useAuth()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<SettingsData>>({})

  useEffect(() => {
    if (token) {
      fetchSettings()
    }
  }, [token])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/users/settings/')
      setSettings(response.data)
      setFormData(response.data)
    } catch (error: any) {
      toast.error('Failed to fetch settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (section: keyof SettingsData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const updateData = {
        user: {
          first_name: formData.user?.first_name,
          last_name: formData.user?.last_name,
        },
        profile: {
          bio: formData.profile?.bio,
          website: formData.profile?.website,
          location: formData.profile?.location,
          privacy: formData.profile?.privacy,
        },
        preferences: {
          email_notifications: formData.preferences?.email_notifications,
          push_notifications: formData.preferences?.push_notifications,
        }
      } 
      
      await api.put('/users/settings/', updateData)
      toast.success('Settings saved successfully!')
      fetchSettings() 
    } catch (error: any) {
      console.error('Save error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to save settings'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    try {
      await api.post(endpoints.auth.changePassword, {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPassword
      })
      toast.success('Password changed successfully!')
    } catch (error: any) {
      toast.error('Failed to change password')
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading settings...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-red-600">Failed to load settings</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Settings</h2>
        <p className="text-gray-600">Manage your account preferences and privacy settings.</p>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.user?.first_name || ''}
                onChange={(e) => handleInputChange('user', 'first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.user?.last_name || ''}
                onChange={(e) => handleInputChange('user', 'last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={formData.user?.username || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
          </div>
          
          <AvatarUpload 
            currentAvatar={formData.profile?.avatar_url}
            onAvatarUpdate={(avatarUrl) => handleInputChange('profile', 'avatar_url', avatarUrl)}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Lock className="h-6 w-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          </div>
          
          <PasswordChangeForm onPasswordChange={handlePasswordChange} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Profile Details</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.profile?.bio || ''}
                onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                rows={3}
                maxLength={160}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.profile?.bio?.length || 0}/160 characters
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={formData.profile?.website || ''}
                onChange={(e) => handleInputChange('profile', 'website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourwebsite.com"
              />
              <p className="text-xs text-gray-500 mt-1">Your personal or professional website</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.profile?.location || ''}
                onChange={(e) => handleInputChange('profile', 'location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City, Country"
              />
              <p className="text-xs text-gray-500 mt-1">Where you're located</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Shield className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
            <select
              value={formData.profile?.privacy || 'public'}
              onChange={(e) => handleInputChange('profile', 'privacy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public - Anyone can see your profile</option>
              <option value="followers_only">Followers Only - Only followers can see your profile</option>
              <option value="private">Private - Only you can see your profile</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This setting controls who can view your profile information
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-orange-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferences?.email_notifications || false}
                  onChange={(e) => handleInputChange('preferences', 'email_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-500">Receive push notifications in the app</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preferences?.push_notifications || false}
                  onChange={(e) => handleInputChange('preferences', 'push_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarUpdate: (avatarUrl: string) => void
}

function AvatarUpload({ currentAvatar, onAvatarUpdate }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setSelectedFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', selectedFile)
      
      const response = await api.post('/users/avatar-upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const avatarUrl = response.data.avatar_url
      onAvatarUpdate(avatarUrl)
      toast.success('Avatar updated successfully!')
      
      setSelectedFile(null)
      setPreviewUrl(null)
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to upload avatar'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      await api.delete('/users/avatar-remove/')
      onAvatarUpdate('')
      toast.success('Avatar removed successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to remove avatar'
      toast.error(errorMessage)
    }
  }

  const displayAvatar = previewUrl || currentAvatar

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          {currentAvatar && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              title="Remove avatar"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900">Profile Picture</h4>
          <p className="text-sm text-gray-500">
            Upload a new image or remove the current one
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select New Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          JPEG or PNG, max 2MB
        </p>
      </div>

      {selectedFile && (
        <div className="flex space-x-3">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Avatar'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFile(null)
              setPreviewUrl(null)
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

interface PasswordChangeFormProps {
  onPasswordChange: (oldPassword: string, newPassword: string) => Promise<void>
}

function PasswordChangeForm({ onPasswordChange }: PasswordChangeFormProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)
    try {
      await onPasswordChange(oldPassword, newPassword)
     
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
        <div className="relative">
          <input
            type={showOldPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            placeholder="Enter your current password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            onClick={() => setShowOldPassword(!showOldPassword)}
          >
            {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            placeholder="Enter your new password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            placeholder="Confirm your new password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Changing Password...' : 'Change Password'}
      </Button>
    </form>
  )
}
