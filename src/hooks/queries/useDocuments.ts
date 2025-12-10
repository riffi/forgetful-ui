import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/api'
import type { DocumentFilters, DocumentCreate, DocumentUpdate } from '@/types'

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentKeys.details(), id] as const,
}

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => documentsApi.list(filters),
  })
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.get(id),
    enabled: id > 0,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DocumentCreate) => documentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DocumentUpdate }) =>
      documentsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) })
    },
  })
}
