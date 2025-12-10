import { apiClient } from './client'
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectsResponse,
  ProjectFilters,
} from '@/types'

export const projectsApi = {
  list: async (filters: ProjectFilters = {}): Promise<ProjectsResponse> => {
    const params = new URLSearchParams()

    if (filters.status) params.set('status', filters.status)
    if (filters.project_type) params.set('project_type', filters.project_type)
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.offset) params.set('offset', String(filters.offset))

    const query = params.toString()
    return apiClient.get<ProjectsResponse>(`/projects${query ? `?${query}` : ''}`)
  },

  get: async (id: number): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${id}`)
  },

  create: async (data: ProjectCreate): Promise<Project> => {
    return apiClient.post<Project>('/projects', data)
  },

  update: async (id: number, data: ProjectUpdate): Promise<Project> => {
    return apiClient.put<Project>(`/projects/${id}`, data)
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/projects/${id}`)
  },
}
