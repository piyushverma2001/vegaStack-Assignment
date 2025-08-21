'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { restoreAuth } = useAuth()

  useEffect(() => {
    restoreAuth()
  }, [restoreAuth])

  return <>{children}</>
}

