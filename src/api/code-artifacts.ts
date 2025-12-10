import { apiClient } from './client'
import type {
  CodeArtifact,
  CodeArtifactCreate,
  CodeArtifactUpdate,
  CodeArtifactsResponse,
  CodeArtifactFilters,
} from '@/types'

export const codeArtifactsApi = {
  list: async (filters: CodeArtifactFilters = {}): Promise<CodeArtifactsResponse> => {
    const params = new URLSearchParams()

    if (filters.project_id) params.set('project_id', String(filters.project_id))
    if (filters.language) params.set('language', filters.language)
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.offset) params.set('offset', String(filters.offset))

    const query = params.toString()
    return apiClient.get<CodeArtifactsResponse>(`/code-artifacts${query ? `?${query}` : ''}`)
  },

  get: async (id: number): Promise<CodeArtifact> => {
    return apiClient.get<CodeArtifact>(`/code-artifacts/${id}`)
  },

  create: async (data: CodeArtifactCreate): Promise<CodeArtifact> => {
    return apiClient.post<CodeArtifact>('/code-artifacts', data)
  },

  update: async (id: number, data: CodeArtifactUpdate): Promise<CodeArtifact> => {
    return apiClient.put<CodeArtifact>(`/code-artifacts/${id}`, data)
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/code-artifacts/${id}`)
  },
}
