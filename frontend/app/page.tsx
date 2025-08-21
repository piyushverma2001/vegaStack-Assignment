'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(true)
  const { isAuthenticated, isLoading, restoreAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    restoreAuth()
  }, [restoreAuth])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SocialConnect
          </h1>
          <p className="text-gray-600">
            Connect with friends, share moments, and discover amazing content
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex mb-6">
            <Button
              variant={showLogin ? 'default' : 'outline'}
              onClick={() => setShowLogin(true)}
              className="flex-1"
            >
              Login
            </Button>
            <Button
              variant={!showLogin ? 'default' : 'outline'}
              onClick={() => setShowLogin(false)}
              className="flex-1 ml-2"
            >
              Register
            </Button>
          </div>

          {showLogin ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  )
}
