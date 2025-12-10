import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memoriesApi } from '@/api'
import type { MemoryFilters, MemoryCreate, MemoryUpdate } from '@/types'

export const memoryKeys = {
  all: ['memories'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (filters: MemoryFilters) => [...memoryKeys.lists(), filters] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...memoryKeys.details(), id] as const,
  links: (id: number) => [...memoryKeys.all, 'links', id] as const,
}

export function useMemories(filters: MemoryFilters = {}) {
  return useQuery({
    queryKey: memoryKeys.list(filters),
    queryFn: () => memoriesApi.list(filters),
  })
}

export function useMemory(id: number) {
  return useQuery({
    queryKey: memoryKeys.detail(id),
    queryFn: () => memoriesApi.get(id),
    enabled: id > 0,
  })
}

export function useMemoryLinks(id: number, limit = 20) {
  return useQuery({
    queryKey: memoryKeys.links(id),
    queryFn: () => memoriesApi.getLinks(id, limit),
    enabled: id > 0,
  })
}

export function useCreateMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MemoryCreate) => memoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })
    },
  })
}

export function useUpdateMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemoryUpdate }) =>
      memoriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: memoryKeys.detail(id) })
    },
  })
}

export function useDeleteMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      reason,
      supersededBy,
    }: {
      id: number
      reason?: string
      supersededBy?: number
    }) => memoriesApi.delete(id, reason, supersededBy),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: memoryKeys.detail(id) })
    },
  })
}

export function useSearchMemories() {
  return useMutation({
    mutationFn: ({
      query,
      options,
    }: {
      query: string
      options?: Parameters<typeof memoriesApi.search>[1]
    }) => memoriesApi.search(query, options),
  })
}

export function useLinkMemories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, relatedIds }: { id: number; relatedIds: number[] }) =>
      memoriesApi.linkMemories(id, relatedIds),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.links(id) })
    },
  })
}

export function useUnlinkMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, targetId }: { id: number; targetId: number }) =>
      memoriesApi.removeLink(id, targetId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.links(id) })
    },
  })
}
