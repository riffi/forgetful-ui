import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Group,
  TextInput,
  Textarea,
  Select,
  Button,
  Text,
  Stack,
  Loader,
  Modal,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconTrash,
  IconFolder,
  IconArchive,
  IconBrain,
  IconCode,
  IconDeviceFloppy,
  IconX,
  IconChevronDown,
} from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProjects, useDeleteProject, useCreateProject, useUpdateProject } from '@/hooks'
import { ConfirmDialog } from '@/components/modals'
import { useQuickEdit } from '@/context/QuickEditContext'
import type { Project, ProjectFilters, ProjectType, ProjectStatus, ProjectCreate } from '@/types'
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

interface ProjectCardProps {
  project: Project
  onClick: () => void
  onDoubleClick: () => void
  onDelete: () => void
  onOpen: () => void
  onArchive: () => void
}

function ProjectCard({ project, onClick, onDoubleClick, onDelete, onOpen, onArchive }: ProjectCardProps) {
  const statusColorMap: Record<ProjectStatus, string> = {
    active: classes.badgeStatusActive,
    archived: classes.badgeStatusArchived,
    completed: classes.badgeStatusCompleted,
  }

  return (
    <div
      className={classes.projectCard}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className={classes.cardTop}>
        <span className={classes.cardName}>{project.name}</span>
        <span className={`${classes.badge} ${classes.badgeType}`}>
          {project.project_type.replace(/-/g, ' ')}
        </span>
        <span className={`${classes.badge} ${classes.badgeStatus} ${statusColorMap[project.status]}`}>
          {project.status}
        </span>
      </div>

      <div className={classes.cardMeta}>
        <div className={classes.cardMetaItem}>
          <IconBrain size={13} />
          <span>{project.memory_count} memories</span>
        </div>
        {project.repo_name && (
          <div className={classes.cardMetaItem}>
            <IconCode size={13} />
            <a href={`https://github.com/${project.repo_name}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              {project.repo_name}
            </a>
          </div>
        )}
      </div>

      <div className={classes.cardFooter}>
        <button className={classes.btnOpen} onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          Open
        </button>
        <div className={classes.cardQuickActions}>
          {project.status !== 'archived' && (
            <button className={classes.qaBtn} title="Archive" onClick={(e) => { e.stopPropagation(); onArchive(); }}>
              <IconArchive size={14} />
            </button>
          )}
          <button className={`${classes.qaBtn} ${classes.qaBtnDanger}`} title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <IconTrash size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Projects() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { openPanel } = useQuickEdit()

  // Create modal state
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false)
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  // Archive dialog state
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null)

  // Form state for creating project
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formType, setFormType] = useState<string | null>('development')
  const [formStatus, setFormStatus] = useState<string | null>('active')
  const [formRepoName, setFormRepoName] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Handle ?create=true query param
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      openCreateModal()
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, openCreateModal, setSearchParams])

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormType('development')
    setFormStatus('active')
    setFormRepoName('')
    setFormNotes('')
    setFormErrors({})
  }

  const handleCloseCreateModal = () => {
    resetForm()
    closeCreateModal()
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formName.trim()) errors.name = 'Name is required'
    if (!formDescription.trim()) errors.description = 'Description is required'
    if (!formType) errors.type = 'Type is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateProject = async () => {
    if (!validateForm()) return

    const data: ProjectCreate = {
      name: formName.trim(),
      description: formDescription.trim(),
      project_type: formType as ProjectType,
      status: (formStatus as ProjectStatus) || 'active',
      repo_name: formRepoName.trim() || undefined,
      notes: formNotes.trim() || undefined,
    }

    await createProject.mutateAsync(data)
    handleCloseCreateModal()
  }

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

  // Handle double click / Open button - navigates to full detail page
  const handleOpen = useCallback((project: Project) => {
    navigate(`/projects/${project.id}`)
  }, [navigate])

  // Handle delete
  const handleDelete = async (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await deleteProject.mutateAsync(project.id)
    }
  }

  // Handle archive
  const handleArchiveConfirm = async () => {
    if (archiveTarget) {
      await updateProject.mutateAsync({
        id: archiveTarget.id,
        data: { status: 'archived' },
      })
      setArchiveTarget(null)
    }
  }

  return (
    <div className={classes.container}>
      {/* Page Header */}
      <div className={classes.pageHeader}>
        <h1 className={classes.pageTitle}>Projects</h1>

        <div className={classes.headerSearch}>
          <IconSearch size={15} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          placeholder="Status"
          data={PROJECT_STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          leftSection={<IconFilter size={14} />}
          rightSection={<IconChevronDown size={12} />}
          classNames={{
            input: classes.filterBtn,
            dropdown: classes.filterDropdown,
          }}
          w={140}
        />

        <Select
          placeholder="Type"
          data={PROJECT_TYPE_OPTIONS}
          value={typeFilter}
          onChange={setTypeFilter}
          clearable
          rightSection={<IconChevronDown size={12} />}
          classNames={{
            input: classes.filterBtn,
            dropdown: classes.filterDropdown,
          }}
          w={160}
          searchable
        />

        <button className={classes.btnCreate} onClick={openCreateModal}>
          <IconPlus size={15} strokeWidth={2.5} />
          Create Project
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <Stack align="center" py="xl">
          <Loader color="green" />
          <Text c="dimmed">Loading projects...</Text>
        </Stack>
      ) : filteredData.length === 0 ? (
        <div className={classes.emptyState}>
          <div className={classes.emptyIcon}>
            <IconFolder size={48} />
          </div>
          <h3>No projects found</h3>
          <p>Create your first project to get started</p>
          <button className={classes.btnCreate} onClick={openCreateModal}>
            <IconPlus size={15} strokeWidth={2.5} />
            Create Project
          </button>
        </div>
      ) : (
        <div className={classes.projectsGrid}>
          {filteredData.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleCardClick(project)}
              onDoubleClick={() => handleOpen(project)}
              onOpen={() => handleOpen(project)}
              onDelete={() => handleDelete(project)}
              onArchive={() => setArchiveTarget(project)}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        opened={createModalOpened}
        onClose={handleCloseCreateModal}
        title={
          <Group gap="xs">
            <IconPlus size={20} />
            <Text fw={600} size="lg">Create Project</Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Project name"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={formErrors.name}
          />
          <Textarea
            label="Description"
            placeholder="Brief description of the project"
            required
            minRows={2}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            error={formErrors.description}
          />
          <Select
            label="Type"
            placeholder="Select type"
            required
            data={PROJECT_TYPE_OPTIONS}
            value={formType}
            onChange={setFormType}
            error={formErrors.type}
            searchable
          />
          <Select
            label="Status"
            placeholder="Select status"
            data={PROJECT_STATUS_OPTIONS}
            value={formStatus}
            onChange={setFormStatus}
          />
          <TextInput
            label="Repository"
            placeholder="owner/repo (optional)"
            value={formRepoName}
            onChange={(e) => setFormRepoName(e.target.value)}
          />
          <Textarea
            label="Notes"
            placeholder="Additional notes (optional)"
            minRows={2}
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />
        </Stack>

        <Group justify="flex-end" mt="xl" gap="xs">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconX size={16} />}
            onClick={handleCloseCreateModal}
          >
            Cancel
          </Button>
          <Button
            color="green"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleCreateProject}
            loading={createProject.isPending}
          >
            Create Project
          </Button>
        </Group>
      </Modal>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        opened={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Project"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? The project will be moved to archived status and hidden from the default view.`}
        confirmText="Archive"
        confirmColor="yellow"
        icon={<IconArchive size={24} color="var(--mantine-color-yellow-6)" />}
        isLoading={updateProject.isPending}
      />
    </div>
  )
}
