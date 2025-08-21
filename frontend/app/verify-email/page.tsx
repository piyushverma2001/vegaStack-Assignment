'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { api, endpoints } from '@/lib/api'
import { CheckCircle, XCircle, Mail, AlertCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [email, setEmail] = useState('')
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setVerificationStatus('verifying')
    try {
      const response = await api.post(endpoints.auth.verifyEmail, {
        token: verificationToken
      })
      setVerificationStatus('success')
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error: any) {
      setVerificationStatus('error')
      setErrorMessage(error.response?.data?.error || 'Verification failed')
    }
  }

  const resendVerification = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address')
      return
    }

    setResendStatus('sending')
    try {
      await api.post(endpoints.auth.resendVerification, { email })
      setResendStatus('success')
      setErrorMessage('')
    } catch (error: any) {
      setResendStatus('error')
      setErrorMessage(error.response?.data?.error || 'Failed to resend verification email')
    }
  }

  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        )
      
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-4">Your email has been successfully verified.</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        )
      
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Need a new verification email?</h3>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={resendVerification}
                    disabled={resendStatus === 'sending'}
                    variant="outline"
                  >
                    {resendStatus === 'sending' ? 'Sending...' : 'Resend'}
                  </Button>
                </div>
                {resendStatus === 'success' && (
                  <p className="text-green-600 text-sm mt-2">
                    <CheckCircle className="inline h-4 w-4 mr-1" />
                    Verification email sent!
                  </p>
                )}
                {resendStatus === 'error' && (
                  <p className="text-red-600 text-sm mt-2">
                    <XCircle className="inline h-4 w-4 mr-1" />
                    Failed to send verification email
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-center">
            <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h2>
            <p className="text-gray-600 mb-4">
              Please check your email for a verification link, or enter your email below to resend.
            </p>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={resendVerification}
                  disabled={resendStatus === 'sending'}
                >
                  {resendStatus === 'sending' ? 'Sending...' : 'Resend Verification'}
                </Button>
              </div>
              {resendStatus === 'success' && (
                <p className="text-green-600 text-sm">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  Verification email sent!
                </p>
              )}
              {resendStatus === 'error' && (
                <p className="text-red-600 text-sm">
                  <XCircle className="inline h-4 w-4 mr-1" />
                  Failed to send verification email
                </p>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {renderVerificationStatus()}
        </CardContent>
      </Card>
    </div>
  )
}
