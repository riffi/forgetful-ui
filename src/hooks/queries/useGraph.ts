import { useQuery } from '@tanstack/react-query'
import { graphApi } from '@/api'
import type { GraphFilters } from '@/api'

export const graphKeys = {
  all: ['graph'] as const,
  data: (filters: GraphFilters) => [...graphKeys.all, 'data', filters] as const,
  memorySubgraph: (id: number, depth: number) =>
    [...graphKeys.all, 'memory', id, depth] as const,
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
