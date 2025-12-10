import { apiClient } from './client'
import type {
  Entity,
  EntityCreate,
  EntityUpdate,
  EntitiesResponse,
  EntityFilters,
  EntityRelationship,
  EntityRelationshipCreate,
} from '@/types'

export const entitiesApi = {
  list: async (filters: EntityFilters = {}): Promise<EntitiesResponse> => {
    const params = new URLSearchParams()

    if (filters.entity_type) params.set('entity_type', filters.entity_type)
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.offset) params.set('offset', String(filters.offset))

    const query = params.toString()
    return apiClient.get<EntitiesResponse>(`/entities${query ? `?${query}` : ''}`)
  },

  get: async (id: number): Promise<Entity> => {
    return apiClient.get<Entity>(`/entities/${id}`)
  },

  create: async (data: EntityCreate): Promise<Entity> => {
    return apiClient.post<Entity>('/entities', data)
  },

  update: async (id: number, data: EntityUpdate): Promise<Entity> => {
    return apiClient.put<Entity>(`/entities/${id}`, data)
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/entities/${id}`)
  },

  search: async (
    query: string,
    options: { entityType?: string; limit?: number } = {}
  ): Promise<EntitiesResponse> => {
    return apiClient.post<EntitiesResponse>('/entities/search', {
      query,
      entity_type: options.entityType,
      limit: options.limit ?? 10,
    })
  },

  linkMemory: async (entityId: number, memoryId: number): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(`/entities/${entityId}/memories`, {
      memory_id: memoryId,
    })
  },

  unlinkMemory: async (entityId: number, memoryId: number): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/entities/${entityId}/memories/${memoryId}`)
  },

  getRelationships: async (
    id: number
  ): Promise<{ relationships: EntityRelationship[]; total: number }> => {
    return apiClient.get<{ relationships: EntityRelationship[]; total: number }>(
      `/entities/${id}/relationships`
    )
  },

  createRelationship: async (
    entityId: number,
    data: Omit<EntityRelationshipCreate, 'source_entity_id'>
  ): Promise<EntityRelationship> => {
    return apiClient.post<EntityRelationship>(`/entities/${entityId}/relationships`, {
      target_entity_id: data.target_entity_id,
      relationship_type: data.relationship_type,
      description: data.metadata?.description,
    })
  },

  updateRelationship: async (
    relationshipId: number,
    data: Partial<EntityRelationshipCreate>
  ): Promise<EntityRelationship> => {
    return apiClient.put<EntityRelationship>(`/entities/relationships/${relationshipId}`, data)
  },

  deleteRelationship: async (relationshipId: number): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/entities/relationships/${relationshipId}`)
  },
}
