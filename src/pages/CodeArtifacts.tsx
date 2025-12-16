import { useState, useMemo, useCallback } from 'react'
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
  IconCode,
  IconExternalLink,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useCodeArtifacts, useDeleteCodeArtifact } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import { useQuickEdit } from '@/context/QuickEditContext'
import { UnifiedEditorModal } from '@/components/modals'
import type { CodeArtifact, CodeArtifactFilters } from '@/types'
import classes from './CodeArtifacts.module.css'

const PAGE_SIZE = 20

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'other', label: 'Other' },
]

function LanguageBadge({ language }: { language: string }) {
  const colorMap: Record<string, string> = {
    javascript: 'yellow',
    typescript: 'blue',
    python: 'green',
    rust: 'orange',
    go: 'cyan',
    java: 'red',
    c: 'gray',
    cpp: 'gray',
    csharp: 'violet',
    ruby: 'red',
    php: 'indigo',
    swift: 'orange',
    kotlin: 'violet',
    sql: 'blue',
    bash: 'gray',
  }

  return (
    <Badge size="sm" variant="light" color={colorMap[language] ?? 'gray'}>
      {language}
    </Badge>
  )
}

function TagsList({ tags }: { tags: string[] }) {
  if (!tags?.length) return <Text c="dimmed" size="xs">-</Text>

  return (
    <Group gap={4} wrap="nowrap">
      {tags.slice(0, 2).map((tag) => (
        <Badge key={tag} size="xs" variant="dot" color="cyan">
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

export function CodeArtifacts() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()
  const { openPanel } = useQuickEdit()

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [languageFilter, setLanguageFilter] = useState<string | null>(null)
  const [tagsFilter, setTagsFilter] = useState<string[]>([])

  // Pagination & sorting
  const [page, setPage] = useState(1)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<CodeArtifact>>({
    columnAccessor: 'updated_at',
    direction: 'desc',
  })

  // Selected rows for bulk actions
  const [selectedRecords, setSelectedRecords] = useState<CodeArtifact[]>([])

  // Build filters
  const filters: CodeArtifactFilters = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      language: languageFilter ?? undefined,
      tags: tagsFilter.length > 0 ? tagsFilter : undefined,
      project_id: selectedProjectId ?? undefined,
    }),
    [page, languageFilter, tagsFilter, selectedProjectId]
  )

  // Fetch code artifacts
  const { data, isLoading } = useCodeArtifacts(filters)
  const deleteCodeArtifact = useDeleteCodeArtifact()

  // Filtered data (client-side search for now)
  const filteredData = useMemo(() => {
    if (!data?.code_artifacts) return []
    if (!debouncedSearch) return data.code_artifacts

    const searchLower = debouncedSearch.toLowerCase()
    return data.code_artifacts.filter(
      (c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.tags?.some((t) => t.toLowerCase().includes(searchLower))
    )
  }, [data?.code_artifacts, debouncedSearch])

  // Sorted data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData]
    const { columnAccessor, direction } = sortStatus

    sorted.sort((a, b) => {
      const aVal = a[columnAccessor as keyof CodeArtifact]
      const bVal = b[columnAccessor as keyof CodeArtifact]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredData, sortStatus])

  // Handle row click - opens quick edit panel
  const handleRowClick = useCallback((artifact: CodeArtifact) => {
    openPanel({ type: 'code_artifact', id: artifact.id })
  }, [openPanel])

  // Handle double click - navigates to full detail page
  const handleRowDoubleClick = useCallback((artifact: CodeArtifact) => {
    navigate(`/code-artifacts/${artifact.id}`)
  }, [navigate])

  // Handle delete
  const handleDelete = async (artifact: CodeArtifact) => {
    if (confirm(`Are you sure you want to delete "${artifact.title}"?`)) {
      await deleteCodeArtifact.mutateAsync(artifact.id)
    }
  }

  // Get unique tags for filter
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    data?.code_artifacts?.forEach((c) => c.tags?.forEach((t) => tags.add(t)))
    return Array.from(tags).map((t) => ({ value: t, label: t }))
  }, [data?.code_artifacts])

  return (
    <div className={classes.container}>
      <Group justify="space-between" mb="md">
        <Title order={1} className={classes.title}>
          Code Artifacts
        </Title>
        <Button
          leftSection={<IconPlus size={16} />}
          color="cyan"
          onClick={() => setCreateModalOpen(true)}
        >
          Create Code Artifact
        </Button>
      </Group>

      {/* Filters */}
      <Paper className={classes.filters} mb="md">
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Search code artifacts..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="Language"
            leftSection={<IconFilter size={16} />}
            data={LANGUAGE_OPTIONS}
            value={languageFilter}
            onChange={setLanguageFilter}
            clearable
            w={160}
            searchable
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
              render: (artifact) => (
                <Group gap="xs" wrap="nowrap">
                  <IconCode size={16} color="var(--accent-code)" />
                  <Text size="sm" fw={500} lineClamp={1}>
                    {artifact.title}
                  </Text>
                </Group>
              ),
            },
            {
              accessor: 'language',
              title: 'Language',
              sortable: true,
              width: 130,
              render: (artifact) => <LanguageBadge language={artifact.language} />,
            },
            {
              accessor: 'tags',
              title: 'Tags',
              width: 180,
              render: (artifact) => <TagsList tags={artifact.tags} />,
            },
            {
              accessor: 'updated_at',
              title: 'Updated',
              sortable: true,
              width: 120,
              render: (artifact) => (
                <Text size="xs" c="dimmed">
                  {new Date(artifact.updated_at).toLocaleDateString()}
                </Text>
              ),
            },
            {
              accessor: 'actions',
              title: '',
              width: 60,
              render: (artifact) => (
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
                        navigate(`/code-artifacts/${artifact.id}`)
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
                        handleDelete(artifact)
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
          loaderColor="cyan"
          minHeight={400}
          noRecordsText="No code artifacts found"
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
                      `Delete ${selectedRecords.length} code artifacts?`
                    )
                  ) {
                    Promise.all(
                      selectedRecords.map((c) =>
                        deleteCodeArtifact.mutateAsync(c.id)
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

      {/* Create Code Artifact Modal */}
      <UnifiedEditorModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialType="code_artifact"
      />
    </div>
  )
}
