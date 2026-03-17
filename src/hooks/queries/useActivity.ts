import { useQuery } from '@tanstack/react-query'
import { activityApi } from '@/api'
import type { ActivityFilters } from '@/types'

export const activityKeys = {
  all: ['activity'] as const,
  list: (filters: ActivityFilters) => [...activityKeys.all, 'list', filters] as const,
  entityHistory: (entityType: string, entityId: number) =>
    [...activityKeys.all, 'history', entityType, entityId] as const,
}

export function useActivity(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => activityApi.list(filters),
  })
}

export function useRecentActivity(limit = 15) {
  return useQuery({
    queryKey: activityKeys.list({ limit }),
    queryFn: () => activityApi.list({ limit }),
    refetchInterval: 30000, // Refetch every 30 seconds for "live" feel
  })
}

export function useEntityHistory(
  entityType: string,
  entityId: number,
  options: { limit?: number; offset?: number } = {}
) {
  return useQuery({
    queryKey: activityKeys.entityHistory(entityType, entityId),
    queryFn: () => activityApi.getEntityHistory(entityType, entityId, options),
    enabled: !!entityType && !!entityId,
  })
}
