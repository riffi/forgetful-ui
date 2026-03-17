import { apiClient } from './client'

export interface GraphNode {
  id: string
  type: 'memory' | 'entity' | 'document' | 'code_artifact' | 'project'
  label: string
  depth?: number
  data: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  data?: Record<string, unknown>
}

export interface GraphMeta {
  memory_count: number
  entity_count: number
  project_count?: number
  document_count?: number
  code_artifact_count?: number
  edge_count: number
  center_node_id?: string
  depth?: number
  truncated?: boolean
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  meta: GraphMeta
}

export interface GraphFilters {
  projectId?: number
  includeEntities?: boolean
  limit?: number
}

export type NodeType = 'memory' | 'entity' | 'project' | 'document' | 'code_artifact'

export interface SubgraphFilters {
  nodeId: string
  depth?: number
  nodeTypes?: NodeType[]
  maxNodes?: number
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

  getSubgraph: async (filters: SubgraphFilters): Promise<GraphData> => {
    const params = new URLSearchParams()
    params.set('node_id', filters.nodeId)
    if (filters.depth !== undefined) params.set('depth', String(filters.depth))
    if (filters.nodeTypes?.length) params.set('node_types', filters.nodeTypes.join(','))
    if (filters.maxNodes !== undefined) params.set('max_nodes', String(filters.maxNodes))

    return apiClient.get<GraphData>(`/graph/subgraph?${params.toString()}`)
  },
}
