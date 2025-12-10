import { apiClient } from './client'

export interface GraphNode {
  id: string
  type: 'memory' | 'entity' | 'document' | 'code_artifact' | 'project'
  label: string
  data: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  meta: {
    memory_count: number
    entity_count: number
    edge_count: number
  }
}

export interface GraphFilters {
  projectId?: number
  includeEntities?: boolean
  limit?: number
}

export const graphApi = {
  getData: async (filters: GraphFilters = {}): Promise<GraphData> => {
    const params = new URLSearchParams()

    if (filters.projectId) params.set('project_id', String(filters.projectId))
    if (filters.includeEntities !== undefined) {
      params.set('include_entities', String(filters.includeEntities))
    }
    if (filters.limit) params.set('limit', String(filters.limit))

    const query = params.toString()
    return apiClient.get<GraphData>(`/graph${query ? `?${query}` : ''}`)
  },

  getMemorySubgraph: async (
    memoryId: number,
    depth = 1
  ): Promise<GraphData & { center_memory_id: number }> => {
    return apiClient.get<GraphData & { center_memory_id: number }>(
      `/graph/memory/${memoryId}?depth=${depth}`
    )
  },
}
