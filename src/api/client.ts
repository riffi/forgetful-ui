const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: string
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

export class AuthError extends ApiError {
  constructor() {
    super(401, 'Unauthorized')
    this.name = 'AuthError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    return localStorage.getItem('forgetful_token')
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, body, ...fetchOptions } = options

    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(this.buildUrl(endpoint, params), {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (response.status === 401) {
      localStorage.removeItem('forgetful_token')
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      throw new AuthError()
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => undefined)
      throw new ApiError(response.status, response.statusText, errorBody)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T
    }

    return response.json()
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', body })
  }
}

export const apiClient = new ApiClient()
export default apiClient
