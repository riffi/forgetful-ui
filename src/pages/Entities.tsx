import { useState, useMemo, useCallback } from 'react'
import {
  Group,
  Select,
  Text,
  Paper,
  ActionIcon,
  MultiSelect,
  Menu,
  Button,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconTrash,
  IconDotsVertical,
  IconUsers,
  IconExternalLink,
  IconBuilding,
  IconUser,
  IconDeviceDesktop,
  IconDevices,
  IconChevronDown,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useEntities, useDeleteEntity } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import { useQuickEdit } from '@/context/QuickEditContext'
import { UnifiedEditorModal } from '@/components/modals'
import type { Entity, EntityFilters, EntityType } from '@/types'
import classes from './Entities.module.css'

const PAGE_SIZE = 20

const ENTITY_TYPE_OPTIONS = [
  { value: 'Organization', label: 'Organization' },
  { value: 'Individual', label: 'Individual' },
  { value: 'Team', label: 'Team' },
  { value: 'Device', label: 'Device' },
  { value: 'Other', label: 'Other' },
]

function EntityTypeIcon({ type }: { type: EntityType }) {
  const iconProps = { size: 16, color: 'var(--accent-entity)' }

  switch (type) {
    case 'Organization':
      return <IconBuilding {...iconProps} />
    case 'Individual':
      return <IconUser {...iconProps} />
    case 'Team':
      return <IconUsers {...iconProps} />
    case 'Device':
      return <IconDeviceDesktop {...iconProps} />
    default:
      return <IconDevices {...iconProps} />
  }
}

function EntityTypeBadge({ type }: { type: EntityType }) {
  return (
    <span className={classes.badge}>
      {type}
    </span>
  )
}

function TagsList({ tags }: { tags: string[] }) {
  if (!tags?.length) return <Text c="dimmed" size="xs">-</Text>

  return (
    <Group gap={4} wrap="nowrap">
      {tags.slice(0, 2).map((tag) => (
        <span key={tag} className={classes.tagPill}>{tag}</span>
      ))}
      {tags.length > 2 && (
        <Text size="xs" c="dimmed">
          +{tags.length - 2}
        </Text>
      )}
    </Group>
  )
}

export function Entities() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()
  const { openPanel } = useQuickEdit()

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [tagsFilter, setTagsFilter] = useState<string[]>([])

  // Pagination & sorting
  const [page, setPage] = useState(1)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Entity>>({
    columnAccessor: 'updated_at',
    direction: 'desc',
  })

  // Selected rows for bulk actions
  const [selectedRecords, setSelectedRecords] = useState<Entity[]>([])

  // Build filters
  const filters: EntityFilters = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      entity_type: typeFilter as EntityType | undefined,
      tags: tagsFilter.length > 0 ? tagsFilter : undefined,
      project_id: selectedProjectId ?? undefined,
    }),
    [page, typeFilter, tagsFilter, selectedProjectId]
  )

  // Fetch entities
  const { data, isLoading } = useEntities(filters)
  const deleteEntity = useDeleteEntity()

  // Filtered data (client-side search for now)
  const filteredData = useMemo(() => {
    if (!data?.entities) return []
    if (!debouncedSearch) return data.entities

    const searchLower = debouncedSearch.toLowerCase()
    return data.entities.filter(
      (e) =>
        e.name.toLowerCase().includes(searchLower) ||
        e.notes?.toLowerCase().includes(searchLower) ||
        e.tags?.some((t) => t.toLowerCase().includes(searchLower))
    )
  }, [data?.entities, debouncedSearch])

  // Sorted data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData]
    const { columnAccessor, direction } = sortStatus

    sorted.sort((a, b) => {
      const aVal = a[columnAccessor as keyof Entity]
      const bVal = b[columnAccessor as keyof Entity]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredData, sortStatus])

  // Handle row click - opens quick edit panel
  const handleRowClick = useCallback((entity: Entity) => {
    openPanel({ type: 'entity', id: entity.id })
  }, [openPanel])

  // Handle double click - navigates to full detail page
  const handleRowDoubleClick = useCallback((entity: Entity) => {
    navigate(`/entities/${entity.id}`)
  }, [navigate])

  // Handle delete
  const handleDelete = async (entity: Entity) => {
    if (confirm(`Are you sure you want to delete "${entity.name}"?`)) {
      await deleteEntity.mutateAsync(entity.id)
    }
  }

  // Get unique tags for filter
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    data?.entities?.forEach((e) => e.tags?.forEach((t) => tags.add(t)))
    return Array.from(tags).map((t) => ({ value: t, label: t }))
  }, [data?.entities])

  return (
    <div className={classes.container}>
      {/* Page Header */}
      <div className={classes.pageHeader}>
        <h1 className={classes.pageTitle}>Entities</h1>

        <div className={classes.headerSearch}>
          <IconSearch size={15} />
          <input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          placeholder="Type"
          data={ENTITY_TYPE_OPTIONS}
          value={typeFilter}
          onChange={setTypeFilter}
          clearable
          leftSection={<IconFilter size={14} />}
          rightSection={<IconChevronDown size={12} />}
          classNames={{
            input: classes.filterBtn,
            dropdown: classes.filterDropdown,
          }}
          w={150}
        />

        <MultiSelect
          placeholder="Tags"
          data={availableTags}
          value={tagsFilter}
          onChange={setTagsFilter}
          maxDropdownHeight={200}
          rightSection={<IconChevronDown size={12} />}
          classNames={{
            input: classes.filterBtn,
            dropdown: classes.filterDropdown,
          }}
          w={180}
          searchable
        />

        <button className={classes.btnCreate} onClick={() => setCreateModalOpen(true)}>
          <IconPlus size={15} strokeWidth={2.5} />
          Create Entity
        </button>
      </div>

      {/* Data Table */}
      <Paper className={classes.tableWrapper}>
        <DataTable
          records={sortedData}
          columns={[
            {
              accessor: 'name',
              title: 'Name',
              sortable: true,
              render: (entity) => (
                <Group gap="xs" wrap="nowrap">
                  <EntityTypeIcon type={entity.entity_type} />
                  <Text size="sm" fw={500} lineClamp={1}>
                    {entity.name}
                  </Text>
                </Group>
              ),
            },
            {
              accessor: 'entity_type',
              title: 'Type',
              sortable: true,
              width: 140,
              render: (entity) => <EntityTypeBadge type={entity.entity_type} />,
            },
            {
              accessor: 'tags',
              title: 'Tags',
              width: 200,
              render: (entity) => <TagsList tags={entity.tags} />,
            },
            {
              accessor: 'updated_at',
              title: 'Updated',
              sortable: true,
              width: 120,
              render: (entity) => (
                <Text size="xs" c="dimmed">
                  {new Date(entity.updated_at).toLocaleDateString()}
                </Text>
              ),
            },
            {
              accessor: 'actions',
              title: '',
              width: 60,
              render: (entity) => (
                <Menu shadow="md" position="bottom-end">
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconExternalLink size={14} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/entities/${entity.id}`)
                      }}
                    >
                      View Details
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(entity)
                      }}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ),
            },
          ]}
          fetching={isLoading}
          loaderType="dots"
          loaderColor="orange"
          minHeight={400}
          noRecordsText="No entities found"
          highlightOnHover
          onRowClick={({ record }) => handleRowClick(record)}
          onRowDoubleClick={({ record }) => handleRowDoubleClick(record)}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          selectedRecords={selectedRecords}
          onSelectedRecordsChange={setSelectedRecords}
          totalRecords={data?.total ?? 0}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
        />
      </Paper>

      {/* Bulk Actions Bar */}
      {selectedRecords.length > 0 && (
        <Paper className={classes.bulkActions}>
          <Group justify="space-between">
            <Text size="sm">
              {selectedRecords.length} selected
            </Text>
            <Group gap="xs">
              <Button
                variant="light"
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={() => {
                  if (
                    confirm(
                      `Delete ${selectedRecords.length} entities?`
                    )
                  ) {
                    Promise.all(
                      selectedRecords.map((e) =>
                        deleteEntity.mutateAsync(e.id)
                      )
                    ).then(() => setSelectedRecords([]))
                  }
                }}
              >
                Delete
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      {/* Create Entity Modal */}
      <UnifiedEditorModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialType="entity"
      />
    </div>
  )
}
