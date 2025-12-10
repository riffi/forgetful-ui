import { apiClient } from './client'
import type {
  Memory,
  MemoryCreate,
  MemoryUpdate,
  MemoriesResponse,
  MemoryFilters,
} from '@/types'

export const memoriesApi = {
  list: async (filters: MemoryFilters = {}): Promise<MemoriesResponse> => {
    const params = new URLSearchParams()

    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.offset) params.set('offset', String(filters.offset))
    if (filters.project_id) params.set('project_id', String(filters.project_id))
    if (filters.importance_min) params.set('importance_min', String(filters.importance_min))
    if (filters.importance_max) params.set('importance_max', String(filters.importance_max))
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    if (filters.is_obsolete !== undefined) params.set('include_obsolete', String(filters.is_obsolete))

    const query = params.toString()
    return apiClient.get<MemoriesResponse>(`/memories${query ? `?${query}` : ''}`)
  },

  get: async (id: number): Promise<Memory> => {
    return apiClient.get<Memory>(`/memories/${id}`)
  },

  create: async (data: MemoryCreate): Promise<Memory> => {
    return apiClient.post<Memory>('/memories', data)
  },

  update: async (id: number, data: MemoryUpdate): Promise<Memory> => {
    return apiClient.put<Memory>(`/memories/${id}`, data)
  },

  delete: async (id: number, reason?: string, supersededBy?: number): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/memories/${id}`, {
      reason,
      superseded_by: supersededBy,
    })
  },

  search: async (
    query: string,
    options: {
      context?: string
      k?: number
      includeLinks?: boolean
      importanceThreshold?: number
      projectIds?: number[]
    } = {}
  ): Promise<MemoriesResponse> => {
    return apiClient.post<MemoriesResponse>('/memories/search', {
      query,
      query_context: options.context,
      k: options.k ?? 10,
      include_links: options.includeLinks ?? true,
      importance_threshold: options.importanceThreshold,
      project_ids: options.projectIds,
    })
  },

  linkMemories: async (id: number, relatedIds: number[]): Promise<{ linked_ids: number[] }> => {
    return apiClient.post<{ linked_ids: number[] }>(`/memories/${id}/links`, {
      related_ids: relatedIds,
    })
  },

  getLinks: async (id: number, limit = 20): Promise<{ memory_id: number; linked_memories: Memory[] }> => {
    return apiClient.get<{ memory_id: number; linked_memories: Memory[] }>(
      `/memories/${id}/links?limit=${limit}`
    )
  },

  removeLink: async (id: number, targetId: number): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/memories/${id}/links/${targetId}`)
  },
}
