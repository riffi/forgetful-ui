import { useQuery } from '@tanstack/react-query'
import { graphApi } from '@/api'
import type { GraphFilters, SubgraphFilters, NodeType } from '@/api'

export const graphKeys = {
  all: ['graph'] as const,
  data: (filters: GraphFilters) => [...graphKeys.all, 'data', filters] as const,
  memorySubgraph: (id: number, depth: number) =>
    [...graphKeys.all, 'memory', id, depth] as const,
  subgraph: (nodeId: string, depth: number, nodeTypes: NodeType[], maxNodes: number) =>
    [...graphKeys.all, 'subgraph', nodeId, depth, nodeTypes, maxNodes] as const,
}

export function useGraphData(filters: GraphFilters = {}) {
  return useQuery({
    queryKey: graphKeys.data(filters),
    queryFn: () => graphApi.getData(filters),
  })
}

export function useMemorySubgraph(memoryId: number, depth = 1) {
  return useQuery({
    queryKey: graphKeys.memorySubgraph(memoryId, depth),
    queryFn: () => graphApi.getMemorySubgraph(memoryId, depth),
    enabled: memoryId > 0,
  })
}

export function useSubgraph(filters: SubgraphFilters) {
  const { nodeId, depth = 2, nodeTypes = ['memory', 'entity', 'project', 'document', 'code_artifact'], maxNodes = 200 } = filters
  return useQuery({
    queryKey: graphKeys.subgraph(nodeId, depth, nodeTypes, maxNodes),
    queryFn: () => graphApi.getSubgraph({ nodeId, depth, nodeTypes, maxNodes }),
    enabled: !!nodeId,
  })
}
