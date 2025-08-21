'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const loginSchema = z.object({
  email_or_username: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [verificationRequired, setVerificationRequired] = useState(false)
  const { login } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setVerificationRequired(false)
    
    try {
      await login(data.email_or_username, data.password)
    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error.response?.data?.verification_required) {
        setVerificationRequired(true)
        toast.error('Please verify your email address before logging in.')
      } else {
        const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.'
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {verificationRequired && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 text-sm font-medium">Email verification required</p>
              <p className="text-yellow-700 text-sm">Please check your email and verify your account before logging in.</p>
              <Link href="/verify-email" className="text-yellow-600 hover:text-yellow-500 text-sm underline">
                Need to verify your email?
              </Link>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email_or_username" className="block text-sm font-medium text-gray-700 mb-1">
          Email or Username
        </label>
        <input
          {...register('email_or_username')}
          type="text"
          id="email_or_username"
          className="input-field"
          placeholder="Enter your email or username"
        />
        {errors.email_or_username && (
          <p className="text-red-500 text-sm mt-1">{errors.email_or_username.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className="input-field pr-10"
            placeholder="Enter your password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className="text-center space-y-2">
        <Link
          href="/password-reset"
          className="text-sm text-blue-600 hover:text-blue-500 block"
        >
          Forgot your password?
        </Link>
        <Link
          href="/verify-email"
          className="text-sm text-gray-600 hover:text-gray-500 block"
        >
          Need to verify your email?
        </Link>
      </div>
    </form>
  )
}
