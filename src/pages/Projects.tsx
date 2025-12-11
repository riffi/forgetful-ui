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
  IconFolder,
  IconExternalLink,
  IconArchive,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useDeleteProject } from '@/hooks'
import type { Project, ProjectFilters, ProjectType, ProjectStatus } from '@/types'
import classes from './Projects.module.css'

const PAGE_SIZE = 20

const PROJECT_TYPE_OPTIONS = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'learning', label: 'Learning' },
  { value: 'development', label: 'Development' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'template', label: 'Template' },
  { value: 'product', label: 'Product' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'development-environment', label: 'Dev Environment' },
  { value: 'third-party-library', label: 'Third-party Library' },
  { value: 'open-source', label: 'Open Source' },
]

const PROJECT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'completed', label: 'Completed' },
]

function StatusBadge({ status }: { status: ProjectStatus }) {
  const colorMap: Record<ProjectStatus, string> = {
    active: 'green',
    archived: 'gray',
    completed: 'blue',
  }

  return (
    <Badge size="sm" variant="light" color={colorMap[status]}>
      {status}
    </Badge>
  )
}

function ProjectTypeBadge({ type }: { type: ProjectType }) {
  return (
    <Badge size="xs" variant="outline" color="gray">
      {type.replace(/-/g, ' ')}
    </Badge>
  )
}

export function Projects() {
  const navigate = useNavigate()

  // Filters state
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Pagination & sorting
  const [page, setPage] = useState(1)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Project>>({
    columnAccessor: 'updated_at',
    direction: 'desc',
  })

  // Selected rows for bulk actions
  const [selectedRecords, setSelectedRecords] = useState<Project[]>([])

  // Build filters
  const filters: ProjectFilters = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      project_type: typeFilter as ProjectType | undefined,
      status: statusFilter as ProjectStatus | undefined,
    }),
    [page, typeFilter, statusFilter]
  )

  // Fetch projects
  const { data, isLoading } = useProjects(filters)
  const deleteProject = useDeleteProject()

  // Filtered data (client-side search for now)
  const filteredData = useMemo(() => {
    if (!data?.projects) return []
    if (!debouncedSearch) return data.projects

    const searchLower = debouncedSearch.toLowerCase()
    return data.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.repo_name?.toLowerCase().includes(searchLower)
    )
  }, [data?.projects, debouncedSearch])

  // Sorted data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData]
    const { columnAccessor, direction } = sortStatus

    sorted.sort((a, b) => {
      const aVal = a[columnAccessor as keyof Project]
      const bVal = b[columnAccessor as keyof Project]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [filteredData, sortStatus])

  // Handle row click
  const handleRowClick = (project: Project) => {
    navigate(`/projects/${project.id}`)
  }

  // Handle delete
  const handleDelete = async (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await deleteProject.mutateAsync(project.id)
    }
  }

  return (
    <div className={classes.container}>
      <Group justify="space-between" mb="md">
        <Title order={1} className={classes.title}>
          Projects
        </Title>
        <Button
          leftSection={<IconPlus size={16} />}
          color="green"
          onClick={() => navigate('/projects?create=true')}
        >
          Create Project
        </Button>
      </Group>

      {/* Filters */}
      <Paper className={classes.filters} mb="md">
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Search projects..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="Type"
            leftSection={<IconFilter size={16} />}
            data={PROJECT_TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
            clearable
            w={180}
            searchable
          />
          <Select
            placeholder="Status"
            data={PROJECT_STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            w={140}
          />
        </Group>
      </Paper>

      {/* Data Table */}
      <Paper className={classes.tableWrapper}>
        <DataTable
          records={sortedData}
          columns={[
            {
              accessor: 'name',
              title: 'Name',
              sortable: true,
              render: (project) => (
                <Group gap="xs" wrap="nowrap">
                  <IconFolder size={16} color="var(--accent-project)" />
                  <Text size="sm" fw={500} lineClamp={1}>
                    {project.name}
                  </Text>
                </Group>
              ),
            },
            {
              accessor: 'project_type',
              title: 'Type',
              sortable: true,
              width: 160,
              render: (project) => <ProjectTypeBadge type={project.project_type} />,
            },
            {
              accessor: 'status',
              title: 'Status',
              sortable: true,
              width: 100,
              render: (project) => <StatusBadge status={project.status} />,
            },
            {
              accessor: 'memory_count',
              title: 'Memories',
              sortable: true,
              width: 100,
              textAlign: 'center',
              render: (project) => (
                <Text size="sm" c="dimmed">
                  {project.memory_count}
                </Text>
              ),
            },
            {
              accessor: 'updated_at',
              title: 'Updated',
              sortable: true,
              width: 120,
              render: (project) => (
                <Text size="xs" c="dimmed">
                  {new Date(project.updated_at).toLocaleDateString()}
                </Text>
              ),
            },
            {
              accessor: 'actions',
              title: '',
              width: 60,
              render: (project) => (
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
                        navigate(`/projects/${project.id}`)
                      }}
                    >
                      View Details
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconArchive size={14} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        // TODO: Archive project
                      }}
                    >
                      Archive
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project)
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
          loaderColor="green"
          minHeight={400}
          noRecordsText="No projects found"
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
                color="gray"
                size="xs"
                leftSection={<IconArchive size={14} />}
                onClick={() => {
                  // TODO: Bulk archive
                }}
              >
                Archive
              </Button>
              <Button
                variant="light"
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={() => {
                  if (
                    confirm(
                      `Delete ${selectedRecords.length} projects?`
                    )
                  ) {
                    Promise.all(
                      selectedRecords.map((p) =>
                        deleteProject.mutateAsync(p.id)
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
