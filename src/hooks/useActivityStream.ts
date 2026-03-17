import { useEffect, useState, useCallback, useRef } from 'react'
import type { ActivityEvent } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'disabled'

interface UseActivityStreamOptions {
  entityType?: string
  action?: string
  enabled?: boolean
  onEvent?: (event: ActivityEvent) => void
  maxEvents?: number
}

interface UseActivityStreamResult {
  events: ActivityEvent[]
  status: SSEStatus
  error: string | null
  reconnect: () => void
  clearEvents: () => void
}

export function useActivityStream({
  entityType,
  action,
  enabled = true,
  onEvent,
  maxEvents = 100,
}: UseActivityStreamOptions = {}): UseActivityStreamResult {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [status, setStatus] = useState<SSEStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const getToken = () => localStorage.getItem('forgetful_token')

  const connect = useCallback(() => {
    if (!enabled) {
      setStatus('disabled')
      return
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setStatus('connecting')
    setError(null)

    // Build URL with params
    const url = new URL(`${API_BASE_URL}/activity/stream`, window.location.origin)
    if (entityType) url.searchParams.set('entity_type', entityType)
    if (action) url.searchParams.set('action', action)

    // Add token as query param (EventSource doesn't support headers)
    const token = getToken()
    if (token) {
      url.searchParams.set('token', token)
    }

    const eventSource = new EventSource(url.toString())
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setStatus('connected')
      setError(null)
    }

    eventSource.addEventListener('activity', (e: MessageEvent) => {
      try {
        const eventData = JSON.parse(e.data) as ActivityEvent

        setEvents(prev => {
          const newEvents = [eventData, ...prev]
          // Keep only maxEvents
          return newEvents.slice(0, maxEvents)
        })

        onEvent?.(eventData)
      } catch (err) {
        console.error('Failed to parse SSE event:', err)
      }
    })

    eventSource.onerror = () => {
      setStatus('error')
      setError('Connection lost')
      eventSource.close()

      // Auto-reconnect after 5 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, 5000)
    }
  }, [enabled, entityType, action, onEvent, maxEvents])

  const reconnect = useCallback(() => {
    connect()
  }, [connect])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  // Connect on mount and when deps change
  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  return {
    events,
    status,
    error,
    reconnect,
    clearEvents,
  }
}
