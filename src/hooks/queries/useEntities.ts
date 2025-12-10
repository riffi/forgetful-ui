import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { entitiesApi } from '@/api'
import type { EntityFilters, EntityCreate, EntityUpdate, EntityRelationshipCreate } from '@/types'

export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (filters: EntityFilters) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: number) => [...entityKeys.details(), id] as const,
  relationships: (id: number) => [...entityKeys.all, 'relationships', id] as const,
}

export function useEntities(filters: EntityFilters = {}) {
  return useQuery({
    queryKey: entityKeys.list(filters),
    queryFn: () => entitiesApi.list(filters),
  })
}

export function useEntity(id: number) {
  return useQuery({
    queryKey: entityKeys.detail(id),
    queryFn: () => entitiesApi.get(id),
    enabled: id > 0,
  })
}

export function useEntityRelationships(id: number) {
  return useQuery({
    queryKey: entityKeys.relationships(id),
    queryFn: () => entitiesApi.getRelationships(id),
    enabled: id > 0,
  })
}

export function useCreateEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EntityCreate) => entitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() })
    },
  })
}

export function useUpdateEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EntityUpdate }) =>
      entitiesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(id) })
    },
  })
}

export function useDeleteEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => entitiesApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(id) })
    },
  })
}

export function useSearchEntities() {
  return useMutation({
    mutationFn: ({
      query,
      options,
    }: {
      query: string
      options?: { entityType?: string; limit?: number }
    }) => entitiesApi.search(query, options),
  })
}

export function useLinkEntityToMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entityId, memoryId }: { entityId: number; memoryId: number }) =>
      entitiesApi.linkMemory(entityId, memoryId),
    onSuccess: (_, { entityId }) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(entityId) })
    },
  })
}

export function useUnlinkEntityFromMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entityId, memoryId }: { entityId: number; memoryId: number }) =>
      entitiesApi.unlinkMemory(entityId, memoryId),
    onSuccess: (_, { entityId }) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(entityId) })
    },
  })
}

export function useCreateEntityRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      entityId,
      data,
    }: {
      entityId: number
      data: Omit<EntityRelationshipCreate, 'source_entity_id'>
    }) => entitiesApi.createRelationship(entityId, data),
    onSuccess: (_, { entityId }) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.relationships(entityId) })
    },
  })
}

export function useDeleteEntityRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { relationshipId: number; entityId: number }) =>
      entitiesApi.deleteRelationship(variables.relationshipId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.relationships(variables.entityId) })
    },
  })
}
