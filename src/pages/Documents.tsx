import { useState, useMemo } from 'react'
import {
  Title,
  Group,
  TextInput,
  Select,
  Button,
  Badge,
  Text,
  Paper,
  ActionIcon,
  MultiSelect,
  Menu,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconTrash,
  IconDotsVertical,
  IconFileText,
  IconExternalLink,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useDocuments, useDeleteDocument } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import type { Document, DocumentFilters } from '@/types'
import classes from './Documents.module.css'

const PAGE_SIZE = 20

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: 'Text' },
  { value: 'pdf', label: 'PDF' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'other', label: 'Other' },
]

function DocumentTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    markdown: 'blue',
    text: 'gray',
    pdf: 'red',
    html: 'orange',
    json: 'yellow',
    yaml: 'cyan',
  }

  return (
    <Badge size="sm" variant="light" color={colorMap[type] ?? 'gray'}>
      {type}
    </Badge>
  )
}

function TagsList({ tags }: { tags: string[] }) {
  if (!tags?.length) return <Text c="dimmed" size="xs">-</Text>

  return (
    <Group gap={4} wrap="nowrap">
      {tags.slice(0, 2).map((tag) => (
        <Badge key={tag} size="xs" variant="dot" color="blue">
          {tag}
        </Badge>
      ))}
      {tags.length > 2 && (
        <Text size="xs" c="dimmed">
          +{tags.length - 2}
        </Text>
      )}
    </Group>
  )
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Documents() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()

  // Filters state
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [tagsFilter, setTagsFilter] = useState<string[]>([])

  // Pagination & sorting
  const [page, setPage] = useState(1)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Document>>({
    columnAccessor: 'updated_at',
    direction: 'desc',
  })

  // Selected rows for bulk actions
  const [selectedRecords, setSelectedRecords] = useState<Document[]>([])

  // Build filters
  const filters: DocumentFilters = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      document_type: typeFilter ?? undefined,
      tags: tagsFilter.length > 0 ? tagsFilter : undefined,
      project_id: selectedProjectId ?? undefined,
    }),
    [page, typeFilter, tagsFilter, selectedProjectId]
  )

  // Fetch documents
  const { data, isLoading } = useDocuments(filters)
  const deleteDocument = useDeleteDocument()

  // Filtered data (client-side search for now)
  const filteredData = useMemo(() => {
    if (!data?.documents) return []
    if (!debouncedSearch) return data.documents

    const searchLower = debouncedSearch.toLowerCase()
    return data.documents.filter(
      (d) =>
        d.title.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower) ||
        d.filename?.toLowerCase().includes(searchLower) ||
        d.tags?.some((t) => t.toLowerCase().includes(searchLower))
    )
  }, [data?.documents, debouncedSearch])

  // Sorted data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData]
    const { columnAccessor, direction } = sortStatus

    sorted.sort((a, b) => {
      const aVal = a[columnAccessor as keyof Document]
      const bVal = b[columnAccessor as keyof Document]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredData, sortStatus])

  // Handle row click
  const handleRowClick = (document: Document) => {
    navigate(`/documents/${document.id}`)
  }

  // Handle delete
  const handleDelete = async (document: Document) => {
    if (confirm(`Are you sure you want to delete "${document.title}"?`)) {
      await deleteDocument.mutateAsync(document.id)
    }
  }

  // Get unique tags for filter
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    data?.documents?.forEach((d) => d.tags?.forEach((t) => tags.add(t)))
    return Array.from(tags).map((t) => ({ value: t, label: t }))
  }, [data?.documents])

  return (
    <div className={classes.container}>
      <Group justify="space-between" mb="md">
        <Title order={1} className={classes.title}>
          Documents
        </Title>
        <Button
          leftSection={<IconPlus size={16} />}
          color="blue"
          onClick={() => navigate('/documents?create=true')}
        >
          Create Document
        </Button>
      </Group>

      {/* Filters */}
      <Paper className={classes.filters} mb="md">
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Search documents..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="Type"
            leftSection={<IconFilter size={16} />}
            data={DOCUMENT_TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
            clearable
            w={140}
          />
          <MultiSelect
            placeholder="Tags"
            data={availableTags}
            value={tagsFilter}
            onChange={setTagsFilter}
            maxDropdownHeight={200}
            w={200}
            searchable
          />
        </Group>
      </Paper>

      {/* Data Table */}
      <Paper className={classes.tableWrapper}>
        <DataTable
          records={sortedData}
          columns={[
            {
              accessor: 'title',
              title: 'Title',
              sortable: true,
              render: (document) => (
                <Group gap="xs" wrap="nowrap">
                  <IconFileText size={16} color="var(--accent-document)" />
                  <Text size="sm" fw={500} lineClamp={1}>
                    {document.title}
                  </Text>
                </Group>
              ),
            },
            {
              accessor: 'document_type',
              title: 'Type',
              sortable: true,
              width: 120,
              render: (document) => <DocumentTypeBadge type={document.document_type} />,
            },
            {
              accessor: 'tags',
              title: 'Tags',
              width: 180,
              render: (document) => <TagsList tags={document.tags} />,
            },
            {
              accessor: 'size_bytes',
              title: 'Size',
              sortable: true,
              width: 100,
              render: (document) => (
                <Text size="xs" c="dimmed">
                  {formatFileSize(document.size_bytes)}
                </Text>
              ),
            },
            {
              accessor: 'updated_at',
              title: 'Updated',
              sortable: true,
              width: 120,
              render: (document) => (
                <Text size="xs" c="dimmed">
                  {new Date(document.updated_at).toLocaleDateString()}
                </Text>
              ),
            },
            {
              accessor: 'actions',
              title: '',
              width: 60,
              render: (document) => (
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
                        navigate(`/documents/${document.id}`)
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
                        handleDelete(document)
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
          loaderColor="blue"
          minHeight={400}
          noRecordsText="No documents found"
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
                      `Delete ${selectedRecords.length} documents?`
                    )
                  ) {
                    Promise.all(
                      selectedRecords.map((d) =>
                        deleteDocument.mutateAsync(d.id)
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
    </div>
  )
}
