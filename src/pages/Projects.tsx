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
  Menu,
  SimpleGrid,
  Stack,
  Loader,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconTrash,
  IconDotsVertical,
  IconFolder,
  IconExternalLink,
  IconArchive,
  IconBrain,
  IconCalendar,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useDeleteProject } from '@/hooks'
import { useQuickEdit } from '@/context/QuickEditContext'
import type { Project, ProjectFilters, ProjectType, ProjectStatus } from '@/types'
import classes from './Projects.module.css'

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

interface ProjectCardProps {
  project: Project
  onClick: () => void
  onDoubleClick: () => void
  onDelete: () => void
}

function ProjectCard({ project, onClick, onDoubleClick, onDelete }: ProjectCardProps) {
  const navigate = useNavigate()

  return (
    <Paper
      className={classes.projectCard}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className={classes.cardHeader}>
        <div className={classes.cardIcon}>
          <IconFolder size={24} />
        </div>
        <Menu shadow="md" position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
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
                onDelete()
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>

      <Text className={classes.cardTitle} lineClamp={1}>
        {project.name}
      </Text>

      <Text className={classes.cardDescription} lineClamp={2}>
        {project.description || 'No description'}
      </Text>

      <div className={classes.cardMeta}>
        <Group gap={8}>
          <StatusBadge status={project.status} />
          <Badge size="xs" variant="outline" color="gray">
            {project.project_type.replace(/-/g, ' ')}
          </Badge>
        </Group>
      </div>

      <div className={classes.cardFooter}>
        <Group gap={16}>
          <Group gap={4}>
            <IconBrain size={14} color="var(--accent-memory)" />
            <Text size="xs" c="dimmed">{project.memory_count}</Text>
          </Group>
          <Group gap={4}>
            <IconCalendar size={14} color="var(--text-dimmed)" />
            <Text size="xs" c="dimmed">
              {new Date(project.updated_at).toLocaleDateString()}
            </Text>
          </Group>
        </Group>
      </div>
    </Paper>
  )
}

export function Projects() {
  const navigate = useNavigate()
  const { openPanel } = useQuickEdit()

  // Filters state
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Build filters
  const filters: ProjectFilters = useMemo(
    () => ({
      limit: 50,
      offset: 0,
      project_type: typeFilter as ProjectType | undefined,
      status: statusFilter as ProjectStatus | undefined,
    }),
    [typeFilter, statusFilter]
  )

  // Fetch projects
  const { data, isLoading } = useProjects(filters)
  const deleteProject = useDeleteProject()

  // Filtered data (client-side search)
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

  // Handle card click - opens quick edit panel
  const handleCardClick = useCallback((project: Project) => {
    openPanel({ type: 'project', id: project.id })
  }, [openPanel])

  // Handle double click - navigates to full detail page
  const handleCardDoubleClick = useCallback((project: Project) => {
    navigate(`/projects/${project.id}`)
  }, [navigate])

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

      {/* Projects Grid */}
      {isLoading ? (
        <Stack align="center" py="xl">
          <Loader color="green" />
          <Text c="dimmed">Loading projects...</Text>
        </Stack>
      ) : filteredData.length === 0 ? (
        <Paper className={classes.emptyState}>
          <Stack align="center" gap="md">
            <div className={classes.emptyIcon}>
              <IconFolder size={48} />
            </div>
            <Title order={3}>No projects found</Title>
            <Text c="dimmed">Create your first project to get started</Text>
            <Button
              leftSection={<IconPlus size={16} />}
              color="green"
              onClick={() => navigate('/projects?create=true')}
            >
              Create Project
            </Button>
          </Stack>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {filteredData.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleCardClick(project)}
              onDoubleClick={() => handleCardDoubleClick(project)}
              onDelete={() => handleDelete(project)}
            />
          ))}
        </SimpleGrid>
      )}
    </div>
  )
}
