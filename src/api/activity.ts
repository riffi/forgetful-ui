import { apiClient } from './client'
import type { ActivityResponse, ActivityFilters } from '@/types'

export const activityApi = {
  list: async (filters: ActivityFilters = {}): Promise<ActivityResponse> => {
    const params: Record<string, string | number | boolean | undefined> = {}

    if (filters.entity_type) params.entity_type = filters.entity_type
    if (filters.action) params.action = filters.action
    if (filters.entity_id) params.entity_id = filters.entity_id
    if (filters.actor) params.actor = filters.actor
    if (filters.since) params.since = filters.since
    if (filters.until) params.until = filters.until
    if (filters.limit) params.limit = filters.limit
    if (filters.offset) params.offset = filters.offset

    return apiClient.get<ActivityResponse>('/activity', params)
  },

  getEntityHistory: async (
    entityType: string,
    entityId: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ActivityResponse> => {
    const params: Record<string, string | number | undefined> = {}
    if (options.limit) params.limit = options.limit
    if (options.offset) params.offset = options.offset

    return apiClient.get<ActivityResponse>(`/activity/${entityType}/${entityId}`, params)
  },
}
