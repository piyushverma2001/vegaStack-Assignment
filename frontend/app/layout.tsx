import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { NotificationManager } from '@/components/notifications/NotificationManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SocialConnect - Connect with Friends',
  description: 'A social media platform for sharing moments and connecting with friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <NotificationManager />
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
