import { useState, useMemo, useCallback } from 'react'
import {
  Title,
  Group,
  Select,
  Badge,
  Text,
  Paper,
  MultiSelect,
  Button,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconArchive,
  IconPower,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useMemories, useDeleteMemory, useUpdateMemory, useProjects } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import { useQuickEdit } from '@/context/QuickEditContext'
import { CreateMemoryModal } from '@/components/modals'
import type { Memory, MemoryFilters } from '@/types'
import classes from './Memories.module.css'

const PAGE_SIZE = 20

function formatRelativeTime(dateInput: string | Date): string {
  const now = Date.now()
  // Ensure we parse the date correctly - if string doesn't have timezone, treat as UTC
  const dateStr = typeof dateInput === 'string' ? dateInput : dateInput.toISOString()
  const then = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z').getTime()

  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 0) return 'just now' // future date protection
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffWeek < 4) return `${diffWeek}w ago`
  return `${diffMonth}mo ago`
}

export function Memories() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()
  const { openPanel } = useQuickEdit()

  // Create modal state
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [importanceFilter, setImportanceFilter] = useState<string | null>(null)
  const [tagsFilter, setTagsFilter] = useState<string[]>([])
  const [showObsolete, setShowObsolete] = useState(false)

  // Pagination & sorting
  const [page, setPage] = useState(1)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Memory>>({
    columnAccessor: 'updated_at',
    direction: 'desc',
  })

  // Selected rows for bulk actions
  const [selectedRecords, setSelectedRecords] = useState<Memory[]>([])

  // Build filters
  const filters: MemoryFilters = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      importance_min: importanceFilter ? parseInt(importanceFilter) : undefined,
      tags: tagsFilter.length > 0 ? tagsFilter : undefined,
      is_obsolete: showObsolete || undefined,
      project_id: selectedProjectId ?? undefined,
    }),
    [page, importanceFilter, tagsFilter, showObsolete, selectedProjectId]
  )

  // Fetch memories
  const { data, isLoading } = useMemories(filters)
  const deleteMemory = useDeleteMemory()
  const updateMemory = useUpdateMemory()

  // Fetch projects for displaying project names
  const { data: projectsData } = useProjects({ limit: 100 })
  const projectsMap = useMemo(() => {
    const map = new Map<number, string>()
    projectsData?.projects?.forEach((p) => map.set(p.id, p.name))
    return map
  }, [projectsData?.projects])

  // Filtered data (client-side search for now)
  const filteredData = useMemo(() => {
    if (!data?.memories) return []
    if (!debouncedSearch) return data.memories

    const searchLower = debouncedSearch.toLowerCase()
    return data.memories.filter(
      (m) =>
        m.title.toLowerCase().includes(searchLower) ||
        m.content?.toLowerCase().includes(searchLower) ||
        m.tags?.some((t) => t.toLowerCase().includes(searchLower))
    )
  }, [data?.memories, debouncedSearch])

  // Sorted data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData]
    const { columnAccessor, direction } = sortStatus

    sorted.sort((a, b) => {
      const aVal = a[columnAccessor as keyof Memory]
      const bVal = b[columnAccessor as keyof Memory]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredData, sortStatus])

  // Handle row click - opens quick edit panel
  const handleRowClick = useCallback((memory: Memory) => {
    openPanel({ type: 'memory', id: memory.id })
  }, [openPanel])

  // Handle double click - navigates to full detail page
  const handleRowDoubleClick = useCallback((memory: Memory) => {
    navigate(`/memories/${memory.id}`)
  }, [navigate])

  // Handle delete
  const handleDelete = async (memory: Memory) => {
    if (confirm(`Are you sure you want to mark "${memory.title}" as obsolete?`)) {
      await deleteMemory.mutateAsync({ id: memory.id })
    }
  }

  // Get unique tags for filter
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    data?.memories?.forEach((m) => m.tags?.forEach((t) => tags.add(t)))
    return Array.from(tags).map((t) => ({ value: t, label: t }))
  }, [data?.memories])

  // Handle inline tag add
  const handleTagAdd = useCallback((memory: Memory, newTag: string) => {
    if (newTag.trim() && !memory.tags?.includes(newTag.trim())) {
      const newTags = [...(memory.tags || []), newTag.trim()]
      updateMemory.mutate({ id: memory.id, data: { tags: newTags } })
    }
  }, [updateMemory])

  return (
    <div className={classes.container}>
      {/* Page Header - all in one row like reference */}
      <div className={classes.pageHeader}>
        <Title order={1} className={classes.title}>
          Memories
        </Title>

        {/* Search */}
        <div className={classes.headerSearch}>
          <IconSearch size={16} color="var(--text-dimmed)" />
          <input
            type="text"
            placeholder="Search title, content, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Group */}
        <div className={classes.filterGroup}>
          <Select
            placeholder="Importance"
            data={[
              { value: '9', label: 'High (9-10)' },
              { value: '7', label: 'Medium (7-8)' },
              { value: '1', label: 'Low (<7)' },
            ]}
            value={importanceFilter}
            onChange={setImportanceFilter}
            clearable
            size="sm"
            classNames={{ input: classes.filterInput }}
          />
          <MultiSelect
            placeholder="Tags"
            data={availableTags}
            value={tagsFilter}
            onChange={setTagsFilter}
            maxDropdownHeight={200}
            searchable
            size="sm"
            classNames={{ input: classes.filterInput }}
          />
          <Select
            placeholder="Status"
            data={[
              { value: 'active', label: 'Active' },
              { value: 'obsolete', label: 'Obsolete' },
              { value: 'all', label: 'All' },
            ]}
            value={showObsolete ? 'obsolete' : 'active'}
            onChange={(val) => setShowObsolete(val === 'obsolete')}
            size="sm"
            classNames={{ input: classes.filterInput }}
          />
        </div>

        {/* Create Button */}
        <button
          className={classes.btnPrimary}
          onClick={openCreate}
        >
          <IconPlus size={18} />
          Create Memory
        </button>
      </div>

      {/* Create Memory Modal */}
      <CreateMemoryModal
        opened={createOpened}
        onClose={closeCreate}
      />

      {/* Data Table */}
      <Paper className={classes.tableWrapper}>
        <DataTable
          records={sortedData}
          columns={[
            {
              accessor: 'title',
              title: 'Title',
              sortable: true,
              render: (memory) => (
                <div className={classes.titleCell}>
                  {memory.title}
                  {memory.is_obsolete && (
                    <Badge size="xs" color="gray" variant="outline" ml="xs">
                      obsolete
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              accessor: 'importance',
              title: 'Importance',
              sortable: true,
              width: 120,
              render: (memory) => (
                <div className={classes.importanceIndicator}>
                  <div
                    className={classes.importanceFill}
                    style={{
                      width: `${memory.importance * 10}%`,
                    }}
                    data-level={memory.importance >= 9 ? 'high' : memory.importance >= 7 ? 'medium' : 'low'}
                  />
                </div>
              ),
            },
            {
              accessor: 'tags',
              title: 'Tags',
              width: 220,
              render: (memory) => (
                <div className={classes.tagsCell}>
                  {memory.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className={classes.tag}>
                      {tag}
                    </span>
                  ))}
                  {(memory.tags?.length ?? 0) > 3 && (
                    <span className={classes.tagMore}>+{memory.tags!.length - 3}</span>
                  )}
                  <input
                    type="text"
                    className={classes.addTagInput}
                    placeholder="+ tag"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleTagAdd(memory, e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                    onBlur={(e) => {
                      if (e.currentTarget.value.trim()) {
                        handleTagAdd(memory, e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              ),
            },
            {
              accessor: 'project_ids',
              title: 'Project',
              width: 140,
              render: (memory) => {
                const projectId = memory.project_ids?.[0]
                const projectName = projectId ? projectsMap.get(projectId) : null
                return projectName ? (
                  <span className={classes.projectBadge}>
                    {projectName}
                  </span>
                ) : (
                  <span className={classes.noProject}>—</span>
                )
              },
            },
            {
              accessor: 'updated_at',
              title: 'Updated',
              sortable: true,
              width: 80,
              render: (memory) => (
                <span className={classes.dateCell}>
                  {formatRelativeTime(memory.updated_at)}
                </span>
              ),
            },
            {
              accessor: 'actions',
              title: 'Actions',
              width: 100,
              render: (memory) => (
                <div className={classes.actionsCell}>
                  <button
                    className={classes.actionBtn}
                    title="Mark Obsolete"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(memory)
                    }}
                  >
                    <IconPower size={16} />
                  </button>
                  <button
                    className={`${classes.actionBtn} ${classes.actionBtnDelete}`}
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement permanent delete
                    }}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          fetching={isLoading}
          loaderType="dots"
          loaderColor="purple"
          minHeight={400}
          noRecordsText="No memories found"
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
          rowClassName={(record) =>
            record.is_obsolete ? classes.obsoleteRow : undefined
          }
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
                leftSection={<IconArchive size={14} />}
                onClick={() => {
                  if (
                    confirm(
                      `Mark ${selectedRecords.length} memories as obsolete?`
                    )
                  ) {
                    Promise.all(
                      selectedRecords.map((m) =>
                        deleteMemory.mutateAsync({ id: m.id })
                      )
                    ).then(() => setSelectedRecords([]))
                  }
                }}
              >
                Mark Obsolete
              </Button>
            </Group>
          </Group>
        </Paper>
      )}
    </div>
  )
}
