'use client'

import { UserProfile } from '@/components/users/UserProfile'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfilePage() {
  const params = useParams()
  const userId = params.userId as string

  useEffect(() => {
    console.log('Profile page userId:', userId)
  }, [params, userId])

  if (!userId) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <UserProfile userId={userId} />
      </div>
    </div>
  )
}
