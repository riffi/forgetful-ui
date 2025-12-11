import { useState } from 'react'
import {
  Title,
  Text,
  Group,
  Stack,
  Paper,
  Badge,
  Button,
  TextInput,
  Textarea,
  Select,
  Breadcrumbs,
  Anchor,
  Skeleton,
  Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconFolder,
  IconPencil,
  IconTrash,
  IconDeviceFloppy,
  IconX,
  IconArrowLeft,
  IconCalendar,
  IconHash,
  IconBrain,
  IconBrandGithub,
} from '@tabler/icons-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks'
import type { ProjectType, ProjectStatus } from '@/types'
import classes from './ProjectDetail.module.css'

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
    <Badge size="lg" variant="light" color={colorMap[status]}>
      {status}
    </Badge>
  )
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = parseInt(id ?? '0')

  const { data: project, isLoading, isError } = useProject(projectId)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedType, setEditedType] = useState<ProjectType>('personal')
  const [editedStatus, setEditedStatus] = useState<ProjectStatus>('active')
  const [editedRepoName, setEditedRepoName] = useState('')
  const [editedNotes, setEditedNotes] = useState('')

  // Delete modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

  // Start editing
  const startEditing = () => {
    if (!project) return
    setEditedName(project.name)
    setEditedDescription(project.description)
    setEditedType(project.project_type)
    setEditedStatus(project.status)
    setEditedRepoName(project.repo_name ?? '')
    setEditedNotes(project.notes ?? '')
    setIsEditing(true)
  }

  // Save changes
  const handleSave = async () => {
    await updateProject.mutateAsync({
      id: projectId,
      data: {
        name: editedName,
        description: editedDescription,
        project_type: editedType,
        status: editedStatus,
        repo_name: editedRepoName || undefined,
        notes: editedNotes || undefined,
      },
    })
    setIsEditing(false)
  }

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false)
  }

  // Handle delete
  const handleDelete = async () => {
    await deleteProject.mutateAsync(projectId)
    closeDelete()
    navigate('/projects')
  }

  if (isLoading) {
    return (
      <div className={classes.container}>
        <Skeleton height={40} width={300} mb="md" />
        <Skeleton height={200} mb="md" />
        <Skeleton height={100} />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className={classes.container}>
        <Paper className={classes.errorState}>
          <Stack align="center" gap="md">
            <IconFolder size={48} color="var(--text-dimmed)" />
            <Title order={3}>Project not found</Title>
            <Text c="dimmed">The project you're looking for doesn't exist.</Text>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/projects')}
            >
              Back to Projects
            </Button>
          </Stack>
        </Paper>
      </div>
    )
  }

  const breadcrumbs = [
    { title: 'Projects', href: '/projects' },
    { title: project.name, href: `/projects/${project.id}` },
  ].map((item, index) => (
    <Anchor key={index} component={Link} to={item.href} size="sm">
      {item.title}
    </Anchor>
  ))

  return (
    <div className={classes.container}>
      <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>

      {/* Header */}
      <Paper className={classes.header} mb="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <IconFolder size={32} color="var(--accent-project)" />
            {isEditing ? (
              <TextInput
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                size="lg"
                style={{ flex: 1 }}
                placeholder="Project name..."
              />
            ) : (
              <Title order={2} lineClamp={1} style={{ flex: 1 }}>
                {project.name}
              </Title>
            )}
          </Group>
          <Group gap="xs">
            <StatusBadge status={project.status} />
            {isEditing ? (
              <>
                <Button
                  variant="light"
                  color="gray"
                  leftSection={<IconX size={16} />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  color="green"
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={updateProject.isPending}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="light"
                  leftSection={<IconPencil size={16} />}
                  onClick={startEditing}
                >
                  Edit
                </Button>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={openDelete}
                >
                  Delete
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Main Content Grid */}
      <div className={classes.grid}>
        {/* Left Column - Content */}
        <div className={classes.mainColumn}>
          {/* Type & Status */}
          <Paper className={classes.section} mb="md">
            <Group gap="xl">
              <div style={{ flex: 1 }}>
                <Text className={classes.sectionLabel}>Type</Text>
                {isEditing ? (
                  <Select
                    value={editedType}
                    onChange={(val) => setEditedType(val as ProjectType)}
                    data={PROJECT_TYPE_OPTIONS}
                    searchable
                  />
                ) : (
                  <Badge variant="outline" color="gray" size="lg">
                    {project.project_type.replace(/-/g, ' ')}
                  </Badge>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <Text className={classes.sectionLabel}>Status</Text>
                {isEditing ? (
                  <Select
                    value={editedStatus}
                    onChange={(val) => setEditedStatus(val as ProjectStatus)}
                    data={PROJECT_STATUS_OPTIONS}
                  />
                ) : (
                  <StatusBadge status={project.status} />
                )}
              </div>
            </Group>
          </Paper>

          {/* Description */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Description</Text>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                minRows={4}
                autosize
                placeholder="Project description..."
              />
            ) : (
              <Text className={classes.contentText}>
                {project.description || <span style={{ color: 'var(--text-dimmed)' }}>No description</span>}
              </Text>
            )}
          </Paper>

          {/* Repository */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Repository</Text>
            {isEditing ? (
              <TextInput
                value={editedRepoName}
                onChange={(e) => setEditedRepoName(e.target.value)}
                placeholder="e.g., owner/repo-name"
                leftSection={<IconBrandGithub size={16} />}
              />
            ) : project.repo_name ? (
              <Group gap="xs">
                <IconBrandGithub size={16} color="var(--text-secondary)" />
                <Text className={classes.contentText}>{project.repo_name}</Text>
              </Group>
            ) : (
              <Text c="dimmed">No repository linked</Text>
            )}
          </Paper>

          {/* Notes */}
          <Paper className={classes.section}>
            <Text className={classes.sectionLabel}>Notes</Text>
            {isEditing ? (
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                minRows={3}
                autosize
                placeholder="Additional notes..."
              />
            ) : (
              <Text className={classes.contentText}>
                {project.notes || <span style={{ color: 'var(--text-dimmed)' }}>No notes</span>}
              </Text>
            )}
          </Paper>
        </div>

        {/* Right Column - Sidebar */}
        <div className={classes.sidebar}>
          {/* Metadata */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Metadata</Text>
            <Stack gap="xs">
              <Group gap="xs">
                <IconHash size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  ID: {project.id}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Created: {new Date(project.created_at).toLocaleString()}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Updated: {new Date(project.updated_at).toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Stats */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Statistics</Text>
            <Stack gap="xs">
              <Group gap="xs">
                <IconBrain size={14} color="var(--accent-memory)" />
                <Text size="sm">
                  {project.memory_count} memories
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Actions */}
          <Paper className={classes.section}>
            <Text className={classes.sectionLabel} mb="sm">
              Actions
            </Text>
            <Stack gap="xs">
              <Button
                variant="light"
                leftSection={<IconBrain size={16} />}
                fullWidth
                onClick={() => navigate(`/memories?project=${project.id}`)}
              >
                View Memories
              </Button>
            </Stack>
          </Paper>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete Project"
        centered
      >
        <Stack>
          <Text size="sm">
            Are you sure you want to delete "{project.name}"? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={closeDelete}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={deleteProject.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}
