import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'

type AuthMode = 'disabled' | 'jwt' | 'oauth' | 'unknown'

interface User {
  id: string
  email?: string
  name?: string
  notes?: string
  created_at?: string
  updated_at?: string
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
  login: () => Promise<void>
  logout: () => void
  setToken: (token: string) => void
}

// PKCE utilities
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => charset[byte % charset.length]).join('')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  bytes.forEach(byte => str += String.fromCharCode(byte))
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generatePKCE() {
  const verifier = generateRandomString(64)
  const challengeBuffer = await sha256(verifier)
  const challenge = base64urlEncode(challengeBuffer)
  return { verifier, challenge }
}

// OAuth client registration
interface OAuthClientInfo {
  client_id: string
  client_secret?: string
}

const OAUTH_CLIENT_KEY = 'forgetful_oauth_client'
const OAUTH_PKCE_KEY = 'forgetful_oauth_pkce'
const OAUTH_STATE_KEY = 'forgetful_oauth_state'

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
  const isHandlingCallback = useRef(false)

  // Handle OAuth callback on mount
  useEffect(() => {
    handleOAuthCallback()
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

  async function handleOAuthCallback() {
    // Prevent double handling
    if (isHandlingCallback.current) return

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const returnedState = urlParams.get('state')
    const error = urlParams.get('error')

    // Check for direct token in URL (legacy flow)
    const urlToken = urlParams.get('token')
    if (urlToken) {
      localStorage.setItem('forgetful_token', urlToken)
      window.history.replaceState({}, '', window.location.pathname)
      detectAuthMode()
      return
    }

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error, urlParams.get('error_description'))
      localStorage.removeItem(OAUTH_PKCE_KEY)
      localStorage.removeItem(OAUTH_STATE_KEY)
      window.history.replaceState({}, '', window.location.pathname)
      detectAuthMode()
      return
    }

    // Handle OAuth callback with authorization code
    if (code && returnedState) {
      isHandlingCallback.current = true
      const savedState = localStorage.getItem(OAUTH_STATE_KEY)
      const savedVerifier = localStorage.getItem(OAUTH_PKCE_KEY)
      const clientInfo = getStoredClient()

      if (returnedState !== savedState) {
        console.error('OAuth state mismatch')
        localStorage.removeItem(OAUTH_PKCE_KEY)
        localStorage.removeItem(OAUTH_STATE_KEY)
        window.history.replaceState({}, '', window.location.pathname)
        detectAuthMode()
        isHandlingCallback.current = false
        return
      }

      if (!savedVerifier || !clientInfo) {
        console.error('Missing PKCE verifier or client info')
        window.history.replaceState({}, '', window.location.pathname)
        detectAuthMode()
        isHandlingCallback.current = false
        return
      }

      try {
        // Exchange code for tokens
        const tokenResponse = await fetch('/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${window.location.origin}/`,
            client_id: clientInfo.client_id,
            client_secret: clientInfo.client_secret || '',
            code_verifier: savedVerifier,
          }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}))
          console.error('Token exchange failed:', errorData)
          throw new Error('Token exchange failed')
        }

        const tokens = await tokenResponse.json()
        localStorage.setItem('forgetful_token', tokens.access_token)
        if (tokens.refresh_token) {
          localStorage.setItem('forgetful_refresh_token', tokens.refresh_token)
        }

        // Clean up
        localStorage.removeItem(OAUTH_PKCE_KEY)
        localStorage.removeItem(OAUTH_STATE_KEY)
        window.history.replaceState({}, '', window.location.pathname)

        setState(s => ({
          ...s,
          isLoading: false,
          isAuthenticated: true,
          token: tokens.access_token,
          authMode: 'oauth',
        }))
      } catch (err) {
        console.error('OAuth callback error:', err)
        localStorage.removeItem(OAUTH_PKCE_KEY)
        localStorage.removeItem(OAUTH_STATE_KEY)
        window.history.replaceState({}, '', window.location.pathname)
        detectAuthMode()
      }
      isHandlingCallback.current = false
      return
    }

    // No OAuth callback, just detect auth mode
    detectAuthMode()
  }

  function getStoredClient(): OAuthClientInfo & { redirect_uri?: string } | null {
    const stored = localStorage.getItem(OAUTH_CLIENT_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
    return null
  }

  async function registerClient(forceNew = false): Promise<OAuthClientInfo> {
    const currentRedirectUri = `${window.location.origin}/`
    const stored = getStoredClient()

    // Use stored client only if redirect_uri matches current origin
    if (stored && !forceNew && stored.redirect_uri === currentRedirectUri) {
      return stored
    }

    // Clear old client if exists
    if (stored) {
      localStorage.removeItem(OAUTH_CLIENT_KEY)
    }

    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Forgetful UI',
        redirect_uris: [`${window.location.origin}/`],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_post',
      }),
    })

    if (!response.ok) {
      throw new Error('Client registration failed')
    }

    const clientInfo = await response.json()
    localStorage.setItem(OAUTH_CLIENT_KEY, JSON.stringify({
      client_id: clientInfo.client_id,
      client_secret: clientInfo.client_secret,
      redirect_uri: currentRedirectUri,
    }))

    return clientInfo
  }

  async function detectAuthMode() {
    try {
      const storedToken = localStorage.getItem('forgetful_token')

      // Try a test request to detect auth mode
      const headers: HeadersInit = {}
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`
      }

      const response = await fetch('/api/v1/memories?limit=1', { headers })

      if (response.ok) {
        // Request succeeded - either auth disabled or token valid
        setState(s => ({
          ...s,
          isLoading: false,
          isAuthenticated: true,
          token: storedToken,
          authMode: storedToken ? 'oauth' : 'disabled',
        }))
        return
      }

      if (response.status === 401) {
        // Clear invalid token
        if (storedToken) {
          localStorage.removeItem('forgetful_token')
        }

        // Auth required - check for OAuth metadata
        try {
          const metadataRes = await fetch('/.well-known/oauth-authorization-server')
          if (metadataRes.ok) {
            setState(s => ({
              ...s,
              isLoading: false,
              isAuthenticated: false,
              authMode: 'oauth',
              oauthProviders: ['github'], // FastMCP uses configured provider
            }))
            return
          }
        } catch {
          // No OAuth metadata
        }

        setState(s => ({
          ...s,
          isLoading: false,
          isAuthenticated: false,
          authMode: 'jwt',
          oauthProviders: [],
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

  const login = useCallback(async () => {
    try {
      // Register OAuth client if needed
      const clientInfo = await registerClient()

      // Generate PKCE
      const { verifier, challenge } = await generatePKCE()
      const state = generateRandomString(32)

      // Store PKCE verifier and state for callback
      localStorage.setItem(OAUTH_PKCE_KEY, verifier)
      localStorage.setItem(OAUTH_STATE_KEY, state)

      // Build authorization URL
      const authUrl = new URL('/authorize', window.location.origin)
      authUrl.searchParams.set('client_id', clientInfo.client_id)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('redirect_uri', `${window.location.origin}/`)
      authUrl.searchParams.set('scope', 'user')
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', challenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      // Redirect to authorization endpoint
      window.location.href = authUrl.toString()
    } catch (err) {
      console.error('Login failed:', err)
    }
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
