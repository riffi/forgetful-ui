import { useQueries } from '@tanstack/react-query'
import { memoriesApi, projectsApi, entitiesApi, documentsApi, codeArtifactsApi, graphApi } from '@/api'
import type { DashboardStats } from '@/types'

export const dashboardKeys = {
  stats: ['dashboard', 'stats'] as const,
}

export function useDashboardStats() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['memories', 'count'],
        queryFn: () => memoriesApi.list({ limit: 1 }),
      },
      {
        queryKey: ['entities', 'count'],
        queryFn: () => entitiesApi.list({ limit: 1 }),
      },
      {
        queryKey: ['projects', 'count'],
        queryFn: () => projectsApi.list({ limit: 1 }),
      },
      {
        queryKey: ['documents', 'count'],
        queryFn: () => documentsApi.list({ limit: 1 }),
      },
      {
        queryKey: ['codeArtifacts', 'count'],
        queryFn: () => codeArtifactsApi.list({ limit: 1 }),
      },
      {
        queryKey: ['graph', 'meta'],
        queryFn: () => graphApi.getData({ limit: 1 }),
      },
    ],
  })

  const isLoading = results.some((r) => r.isLoading)
  const isError = results.some((r) => r.isError)

  const stats: DashboardStats | undefined =
    !isLoading && !isError
      ? {
          memories_count: results[0].data?.total ?? 0,
          entities_count: results[1].data?.total ?? 0,
          projects_count: results[2].data?.total ?? 0,
          documents_count: results[3].data?.total ?? 0,
          code_artifacts_count: results[4].data?.total ?? 0,
          relations_count: results[5].data?.meta?.edge_count ?? 0,
        }
      : undefined

  return {
    stats,
    isLoading,
    isError,
    error: results.find((r) => r.error)?.error,
  }
}

export function useRecentMemories(limit = 10) {
  return memoriesApi.list({ limit, offset: 0 })
}
