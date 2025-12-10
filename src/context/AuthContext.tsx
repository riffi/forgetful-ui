import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type AuthMode = 'disabled' | 'jwt' | 'oauth' | 'unknown'

interface User {
  id: string
  email?: string
  name?: string
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  token: string | null
  authMode: AuthMode
  oauthProviders: string[]
}

interface AuthContextValue extends AuthState {
  login: (provider?: string) => Promise<void>
  logout: () => void
  setToken: (token: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
    authMode: 'unknown',
    oauthProviders: [],
  })

  // Detect auth mode on mount
  useEffect(() => {
    detectAuthMode()
  }, [])

  // Listen for unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      setState(s => ({
        ...s,
        isAuthenticated: false,
        user: null,
        token: null,
      }))
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  async function detectAuthMode() {
    try {
      // Check for token in URL (OAuth callback) or localStorage
      const urlParams = new URLSearchParams(window.location.search)
      const urlToken = urlParams.get('token')
      const storedToken = localStorage.getItem('forgetful_token')
      const token = urlToken || storedToken

      if (urlToken) {
        localStorage.setItem('forgetful_token', urlToken)
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname)
      }

      // Try a test request to detect auth mode
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/v1/memories?limit=1', { headers })

      if (response.ok) {
        // Request succeeded - either auth disabled or token valid
        setState(s => ({
          ...s,
          isLoading: false,
          isAuthenticated: true,
          token: token,
          authMode: token ? 'jwt' : 'disabled',
        }))
        return
      }

      if (response.status === 401) {
        // Auth required - parse WWW-Authenticate header for providers
        const wwwAuth = response.headers.get('WWW-Authenticate')
        const providers: string[] = []

        // Simple parsing - in real impl would be more robust
        if (wwwAuth?.toLowerCase().includes('github')) providers.push('github')
        if (wwwAuth?.toLowerCase().includes('google')) providers.push('google')

        setState(s => ({
          ...s,
          isLoading: false,
          isAuthenticated: false,
          authMode: providers.length > 0 ? 'oauth' : 'jwt',
          oauthProviders: providers,
        }))
        return
      }

      // Other error - assume auth disabled
      setState(s => ({
        ...s,
        isLoading: false,
        isAuthenticated: true,
        authMode: 'disabled',
      }))
    } catch {
      // Network error or backend not available
      setState(s => ({
        ...s,
        isLoading: false,
        authMode: 'unknown',
      }))
    }
  }

  const login = useCallback(async (provider?: string) => {
    if (provider) {
      // OAuth flow - redirect to backend
      const redirectUri = `${window.location.origin}/auth/callback`
      window.location.href = `/oauth/authorize?provider=${provider}&redirect_uri=${encodeURIComponent(redirectUri)}`
    }
    // For JWT mode, the login form would call setToken directly
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('forgetful_token')
    setState(s => ({
      ...s,
      isAuthenticated: false,
      user: null,
      token: null,
    }))
  }, [])

  const setToken = useCallback((token: string) => {
    localStorage.setItem('forgetful_token', token)
    setState(s => ({
      ...s,
      isAuthenticated: true,
      token,
    }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}
