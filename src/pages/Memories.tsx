import { useState, useMemo } from 'react'
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
import { useMemories, useDeleteMemory } from '@/hooks'
import { CreateMemoryModal } from '@/components/modals'
import type { Memory, MemoryFilters } from '@/types'
import classes from './Memories.module.css'

const PAGE_SIZE = 20

function getImportanceClass(value: number): string {
  if (value >= 9) return classes.importanceHigh
  if (value >= 7) return classes.importanceMedium
  return ''
}

export function Memories() {
  const navigate = useNavigate()

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
    }),
    [page, importanceFilter, tagsFilter, showObsolete]
  )

  // Fetch memories
  const { data, isLoading } = useMemories(filters)
  const deleteMemory = useDeleteMemory()

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

  // Handle row click
  const handleRowClick = (memory: Memory) => {
    navigate(`/memories/${memory.id}`)
  }

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
              width: 100,
              render: (memory) => (
                <input
                  type="number"
                  className={`${classes.importanceInput} ${getImportanceClass(memory.importance)}`}
                  value={memory.importance}
                  min={1}
                  max={10}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    // TODO: Implement inline importance update
                    console.log('Update importance:', memory.id, e.target.value)
                  }}
                  readOnly
                />
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
                      <span
                        className={classes.tagRemove}
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Implement tag removal
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                  <button
                    className={classes.addTagBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement add tag
                    }}
                  >
                    + Tag
                  </button>
                </div>
              ),
            },
            {
              accessor: 'updated_at',
              title: 'Updated',
              sortable: true,
              width: 120,
              render: (memory) => (
                <span className={classes.dateCell}>
                  {new Date(memory.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
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
