import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { codeArtifactsApi } from '@/api'
import type { CodeArtifactFilters, CodeArtifactCreate, CodeArtifactUpdate } from '@/types'

export const codeArtifactKeys = {
  all: ['codeArtifacts'] as const,
  lists: () => [...codeArtifactKeys.all, 'list'] as const,
  list: (filters: CodeArtifactFilters) => [...codeArtifactKeys.lists(), filters] as const,
  details: () => [...codeArtifactKeys.all, 'detail'] as const,
  detail: (id: number) => [...codeArtifactKeys.details(), id] as const,
}

export function useCodeArtifacts(filters: CodeArtifactFilters = {}) {
  return useQuery({
    queryKey: codeArtifactKeys.list(filters),
    queryFn: () => codeArtifactsApi.list(filters),
  })
}

export function useCodeArtifact(id: number) {
  return useQuery({
    queryKey: codeArtifactKeys.detail(id),
    queryFn: () => codeArtifactsApi.get(id),
    enabled: id > 0,
  })
}

export function useCreateCodeArtifact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CodeArtifactCreate) => codeArtifactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: codeArtifactKeys.lists() })
    },
  })
}

export function useUpdateCodeArtifact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CodeArtifactUpdate }) =>
      codeArtifactsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: codeArtifactKeys.lists() })
      queryClient.invalidateQueries({ queryKey: codeArtifactKeys.detail(id) })
    },
  })
}

export function useDeleteCodeArtifact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => codeArtifactsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: codeArtifactKeys.lists() })
      queryClient.invalidateQueries({ queryKey: codeArtifactKeys.detail(id) })
    },
  })
}
