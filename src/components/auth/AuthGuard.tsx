import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoadingOverlay } from '@mantine/core'
import { useAuth } from '@/context/AuthContext'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, authMode } = useAuth()

  if (isLoading) {
    return <LoadingOverlay visible />
  }

  // If auth is disabled, allow access (with warning shown separately)
  if (authMode === 'disabled') {
    return <>{children}</>
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
