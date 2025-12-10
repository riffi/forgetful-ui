import { apiClient } from './client'
import type {
  Document,
  DocumentCreate,
  DocumentUpdate,
  DocumentsResponse,
  DocumentFilters,
} from '@/types'

export const documentsApi = {
  list: async (filters: DocumentFilters = {}): Promise<DocumentsResponse> => {
    const params = new URLSearchParams()

    if (filters.project_id) params.set('project_id', String(filters.project_id))
    if (filters.document_type) params.set('document_type', filters.document_type)
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.offset) params.set('offset', String(filters.offset))

    const query = params.toString()
    return apiClient.get<DocumentsResponse>(`/documents${query ? `?${query}` : ''}`)
  },

  get: async (id: number): Promise<Document> => {
    return apiClient.get<Document>(`/documents/${id}`)
  },

  create: async (data: DocumentCreate): Promise<Document> => {
    return apiClient.post<Document>('/documents', data)
  },

  update: async (id: number, data: DocumentUpdate): Promise<Document> => {
    return apiClient.put<Document>(`/documents/${id}`, data)
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/documents/${id}`)
  },
}
