import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Text,
  Group,
  Stack,
  Paper,
  Badge,
  Button,
  Skeleton,
  Modal,
  Tabs,
  Menu,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconFolder,
  IconTrash,
  IconDeviceFloppy,
  IconArrowLeft,
  IconBrain,
  IconBrandGithub,
  IconFile,
  IconCode,
  IconCube,
  IconChevronDown,
  IconArchive,
  IconInfoCircle,
  IconChartBar,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProject, useUpdateProject, useDeleteProject, useMemories, useDocuments, useCodeArtifacts, useEntities } from '@/hooks'
import {
  Breadcrumb,
  DataTable,
  TitleCell,
  TableLink,
  TagList,
  ImportanceValue,
  DateCell,
  ActionLink,
  LanguageCell,
  TypeBadge,
} from '@/components/ui'
import type { ProjectType, ProjectStatus, Memory, Document, CodeArtifact, Entity } from '@/types'
import classes from './ProjectDetail.module.css'

const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'development', label: 'Development' },
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'learning', label: 'Learning' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'template', label: 'Template' },
  { value: 'product', label: 'Product' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'development-environment', label: 'Dev Environment' },
  { value: 'third-party-library', label: 'Third-party Library' },
  { value: 'open-source', label: 'Open Source' },
]

const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'completed', label: 'Completed' },
]

function TypeBadgeDropdown({ type, onChange }: { type: ProjectType; onChange: (type: ProjectType) => void }) {
  const label = PROJECT_TYPE_OPTIONS.find(opt => opt.value === type)?.label ?? type

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Badge
          className={classes.clickableBadge}
          variant="light"
          color="green"
          size="lg"
          leftSection={<IconFolder size={12} />}
          rightSection={<IconChevronDown size={10} />}
        >
          {label}
        </Badge>
      </Menu.Target>
      <Menu.Dropdown>
        {PROJECT_TYPE_OPTIONS.map(opt => (
          <Menu.Item
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={opt.value === type ? classes.menuItemActive : undefined}
          >
            {opt.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

function StatusBadgeDropdown({ status, onChange }: { status: ProjectStatus; onChange: (status: ProjectStatus) => void }) {
  const colorMap: Record<ProjectStatus, string> = {
    active: 'green',
    archived: 'gray',
    completed: 'blue',
  }

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Badge
          className={classes.clickableBadge}
          variant="light"
          color={colorMap[status]}
          size="lg"
          rightSection={<IconChevronDown size={10} />}
        >
          {status}
        </Badge>
      </Menu.Target>
      <Menu.Dropdown>
        {PROJECT_STATUS_OPTIONS.map(opt => (
          <Menu.Item
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={opt.value === status ? classes.menuItemActive : undefined}
          >
            {opt.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

// Inline editable text component
function EditableTitle({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLHeadingElement>(null)

  const handleBlur = () => {
    if (ref.current) {
      const newValue = ref.current.textContent ?? ''
      if (newValue !== value) {
        onChange(newValue)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ref.current?.blur()
    }
  }

  return (
    <h1
      ref={ref}
      className={classes.editableTitle}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {value}
    </h1>
  )
}

// Inline editable content area
function EditableContent({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleBlur = () => {
    if (ref.current) {
      const newValue = ref.current.innerText ?? ''
      if (newValue !== value) {
        onChange(newValue)
      }
    }
  }

  return (
    <div
      ref={ref}
      className={classes.editableContent}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      data-placeholder={placeholder}
    >
      {value || ''}
    </div>
  )
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = parseInt(id ?? '0')

  const { data: project, isLoading, isError } = useProject(projectId)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  // Related content queries
  const { data: memoriesData, isLoading: isLoadingMemories } = useMemories({ project_id: projectId, limit: 10 })
  const { data: documentsData, isLoading: isLoadingDocuments } = useDocuments({ project_id: projectId, limit: 10 })
  const { data: codeArtifactsData, isLoading: isLoadingCodeArtifacts } = useCodeArtifacts({ project_id: projectId, limit: 10 })
  const { data: entitiesData, isLoading: isLoadingEntities } = useEntities({ project_id: projectId, limit: 10 })

  // Local edit state (inline editing)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedType, setEditedType] = useState<ProjectType>('personal')
  const [editedStatus, setEditedStatus] = useState<ProjectStatus>('active')
  const [editedNotes, setEditedNotes] = useState('')

  // Tab search state
  const [memoriesSearch, setMemoriesSearch] = useState('')
  const [documentsSearch, setDocumentsSearch] = useState('')
  const [codeSearch, setCodeSearch] = useState('')
  const [entitiesSearch, setEntitiesSearch] = useState('')

  // Initialize edit state from project data
  useEffect(() => {
    if (project) {
      setEditedName(project.name)
      setEditedDescription(project.description)
      setEditedType(project.project_type)
      setEditedStatus(project.status)
      setEditedNotes(project.notes ?? '')
    }
  }, [project])

  // Check if there are unsaved changes
  const hasChanges = project && (
    editedName !== project.name ||
    editedDescription !== project.description ||
    editedType !== project.project_type ||
    editedStatus !== project.status ||
    editedNotes !== (project.notes ?? '')
  )

  // Delete modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

  // Save changes
  const handleSave = async () => {
    await updateProject.mutateAsync({
      id: projectId,
      data: {
        name: editedName,
        description: editedDescription,
        project_type: editedType,
        status: editedStatus,
        notes: editedNotes || undefined,
      },
    })
  }

  // Handle archive
  const handleArchive = async () => {
    await updateProject.mutateAsync({
      id: projectId,
      data: { status: 'archived' },
    })
  }

  // Handle delete
  const handleDelete = async () => {
    await deleteProject.mutateAsync(projectId)
    closeDelete()
    navigate('/projects')
  }

  // Filter functions for tabs
  const filterMemories = useCallback((search: string) => {
    if (!memoriesData?.memories || !search) return memoriesData?.memories ?? []
    const lower = search.toLowerCase()
    return memoriesData.memories.filter(m =>
      m.title.toLowerCase().includes(lower) ||
      m.tags?.some(t => t.toLowerCase().includes(lower))
    )
  }, [memoriesData])

  const filterDocuments = useCallback((search: string) => {
    if (!documentsData?.documents || !search) return documentsData?.documents ?? []
    const lower = search.toLowerCase()
    return documentsData.documents.filter(d =>
      d.title.toLowerCase().includes(lower)
    )
  }, [documentsData])

  const filterCodeArtifacts = useCallback((search: string) => {
    if (!codeArtifactsData?.code_artifacts || !search) return codeArtifactsData?.code_artifacts ?? []
    const lower = search.toLowerCase()
    return codeArtifactsData.code_artifacts.filter(c =>
      c.title.toLowerCase().includes(lower) ||
      c.language.toLowerCase().includes(lower)
    )
  }, [codeArtifactsData])

  const filterEntities = useCallback((search: string) => {
    if (!entitiesData?.entities || !search) return entitiesData?.entities ?? []
    const lower = search.toLowerCase()
    return entitiesData.entities.filter(e =>
      e.name.toLowerCase().includes(lower) ||
      e.entity_type.toLowerCase().includes(lower)
    )
  }, [entitiesData])

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
            <Text size="xl" fw={600}>Project not found</Text>
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

  const breadcrumbItems = [
    { title: 'Projects', href: '/projects' },
    { title: project.name, href: `/projects/${project.id}` },
  ]

  const filteredMemories = filterMemories(memoriesSearch)
  const filteredDocuments = filterDocuments(documentsSearch)
  const filteredCodeArtifacts = filterCodeArtifacts(codeSearch)
  const filteredEntities = filterEntities(entitiesSearch)

  return (
    <div className={classes.container}>
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className={classes.pageHeader}>
        <div className={classes.headerMain}>
          {/* Badges row */}
          <Group gap="xs" mb="xs">
            <TypeBadgeDropdown type={editedType} onChange={setEditedType} />
            <StatusBadgeDropdown status={editedStatus} onChange={setEditedStatus} />
          </Group>

          {/* Title row */}
          <Group gap="md" align="center">
            <EditableTitle value={editedName} onChange={setEditedName} />
            {project.repo_name && (
              <a
                href={`https://github.com/${project.repo_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.repoLinkBtn}
              >
                <IconBrandGithub size={16} />
                View Repository
              </a>
            )}
          </Group>
        </div>

        {/* Header actions */}
        <Group gap="xs" className={classes.headerActions}>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconTrash size={16} />}
            onClick={openDelete}
            className={classes.btnDanger}
          >
            Delete
          </Button>
          <Button
            variant="default"
            leftSection={<IconArchive size={16} />}
            onClick={handleArchive}
            disabled={editedStatus === 'archived'}
          >
            Archive
          </Button>
          <Button
            color="green"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={updateProject.isPending}
            disabled={!hasChanges}
            className={classes.btnPrimary}
          >
            Save Changes
          </Button>
        </Group>
      </div>

      {/* Main Content Grid */}
      <div className={classes.grid}>
        {/* Left Column - Main Content */}
        <div className={classes.mainColumn}>
          {/* Description */}
          <Paper className={classes.contentCard} mb="md">
            <Text className={classes.cardLabel}>Description</Text>
            <EditableContent
              value={editedDescription}
              onChange={setEditedDescription}
              placeholder="Add a project description..."
            />
          </Paper>

          {/* Notes */}
          <Paper className={classes.contentCard} mb="md">
            <Text className={classes.cardLabel}>Notes</Text>
            <EditableContent
              value={editedNotes}
              onChange={setEditedNotes}
              placeholder="Add notes..."
            />
          </Paper>

          {/* Tabs Section */}
          <div className={classes.tabsContainer}>
            <Tabs defaultValue="memories" classNames={{ root: classes.tabs, list: classes.tabsList, tab: classes.tab }}>
              <Tabs.List>
                <Tabs.Tab value="memories" leftSection={<IconBrain size={16} />}>
                  Memories
                  <span className={classes.tabCount}>{memoriesData?.total ?? 0}</span>
                </Tabs.Tab>
                <Tabs.Tab value="documents" leftSection={<IconFile size={16} />}>
                  Documents
                  <span className={classes.tabCount}>{documentsData?.total ?? 0}</span>
                </Tabs.Tab>
                <Tabs.Tab value="code" leftSection={<IconCode size={16} />}>
                  Code Artifacts
                  <span className={classes.tabCount}>{codeArtifactsData?.total ?? 0}</span>
                </Tabs.Tab>
                <Tabs.Tab value="entities" leftSection={<IconCube size={16} />}>
                  Entities
                  <span className={classes.tabCount}>{entitiesData?.total ?? 0}</span>
                </Tabs.Tab>
              </Tabs.List>

              {/* Memories Tab */}
              <Tabs.Panel value="memories" pt="md">
                <DataTable<Memory>
                  data={filteredMemories}
                  loading={isLoadingMemories}
                  searchValue={memoriesSearch}
                  onSearchChange={setMemoriesSearch}
                  searchPlaceholder="Search memories..."
                  linkButtonLabel="Link Memory"
                  onLinkClick={() => {/* TODO */}}
                  getRowKey={(m) => m.id}
                  emptyIcon={<IconBrain size={32} stroke={1.5} />}
                  emptyText="No memories in this project"
                  columns={[
                    {
                      key: 'title',
                      title: 'Title',
                      render: (memory) => (
                        <TitleCell type="memory">
                          <TableLink onClick={() => navigate(`/memories/${memory.id}`)}>
                            {memory.title}
                          </TableLink>
                        </TitleCell>
                      ),
                    },
                    {
                      key: 'tags',
                      title: 'Tags',
                      render: (memory) => <TagList tags={memory.tags} />,
                    },
                    {
                      key: 'importance',
                      title: 'Importance',
                      width: 100,
                      render: (memory) => <ImportanceValue value={memory.importance} />,
                    },
                    {
                      key: 'created_at',
                      title: 'Created',
                      width: 120,
                      render: (memory) => <DateCell date={memory.created_at} />,
                    },
                    {
                      key: 'actions',
                      title: '',
                      width: 80,
                      render: () => <ActionLink danger>Unlink</ActionLink>,
                    },
                  ]}
                />
              </Tabs.Panel>

              {/* Documents Tab */}
              <Tabs.Panel value="documents" pt="md">
                <DataTable<Document>
                  data={filteredDocuments}
                  loading={isLoadingDocuments}
                  searchValue={documentsSearch}
                  onSearchChange={setDocumentsSearch}
                  searchPlaceholder="Search documents..."
                  linkButtonLabel="Link Document"
                  onLinkClick={() => {/* TODO */}}
                  getRowKey={(d) => d.id}
                  emptyIcon={<IconFile size={32} stroke={1.5} />}
                  emptyText="No documents in this project"
                  columns={[
                    {
                      key: 'title',
                      title: 'Title',
                      render: (doc) => (
                        <TitleCell type="document">
                          <TableLink onClick={() => navigate(`/documents/${doc.id}`)}>
                            {doc.title}
                          </TableLink>
                        </TitleCell>
                      ),
                    },
                    {
                      key: 'type',
                      title: 'Type',
                      width: 120,
                      render: (doc) => <TypeBadge type={doc.document_type} />,
                    },
                    {
                      key: 'created_at',
                      title: 'Created',
                      width: 120,
                      render: (doc) => <DateCell date={doc.created_at} />,
                    },
                    {
                      key: 'actions',
                      title: '',
                      width: 80,
                      render: () => <ActionLink danger>Unlink</ActionLink>,
                    },
                  ]}
                />
              </Tabs.Panel>

              {/* Code Artifacts Tab */}
              <Tabs.Panel value="code" pt="md">
                <DataTable<CodeArtifact>
                  data={filteredCodeArtifacts}
                  loading={isLoadingCodeArtifacts}
                  searchValue={codeSearch}
                  onSearchChange={setCodeSearch}
                  searchPlaceholder="Search code artifacts..."
                  linkButtonLabel="Link Code Artifact"
                  onLinkClick={() => {/* TODO */}}
                  getRowKey={(c) => c.id}
                  emptyIcon={<IconCode size={32} stroke={1.5} />}
                  emptyText="No code artifacts in this project"
                  columns={[
                    {
                      key: 'title',
                      title: 'Title',
                      render: (artifact) => (
                        <TitleCell type="code">
                          <TableLink onClick={() => navigate(`/code-artifacts/${artifact.id}`)}>
                            {artifact.title}
                          </TableLink>
                        </TitleCell>
                      ),
                    },
                    {
                      key: 'language',
                      title: 'Language',
                      width: 120,
                      render: (artifact) => <LanguageCell language={artifact.language} />,
                    },
                    {
                      key: 'created_at',
                      title: 'Created',
                      width: 120,
                      render: (artifact) => <DateCell date={artifact.created_at} />,
                    },
                    {
                      key: 'actions',
                      title: '',
                      width: 80,
                      render: () => <ActionLink danger>Unlink</ActionLink>,
                    },
                  ]}
                />
              </Tabs.Panel>

              {/* Entities Tab */}
              <Tabs.Panel value="entities" pt="md">
                <DataTable<Entity>
                  data={filteredEntities}
                  loading={isLoadingEntities}
                  searchValue={entitiesSearch}
                  onSearchChange={setEntitiesSearch}
                  searchPlaceholder="Search entities..."
                  linkButtonLabel="Link Entity"
                  onLinkClick={() => {/* TODO */}}
                  getRowKey={(e) => e.id}
                  emptyIcon={<IconCube size={32} stroke={1.5} />}
                  emptyText="No entities in this project"
                  columns={[
                    {
                      key: 'name',
                      title: 'Name',
                      render: (entity) => (
                        <TitleCell type="entity">
                          <TableLink onClick={() => navigate(`/entities/${entity.id}`)}>
                            {entity.name}
                          </TableLink>
                        </TitleCell>
                      ),
                    },
                    {
                      key: 'type',
                      title: 'Type',
                      width: 120,
                      render: (entity) => <TypeBadge type={entity.entity_type} />,
                    },
                    {
                      key: 'created_at',
                      title: 'Created',
                      width: 120,
                      render: (entity) => <DateCell date={entity.created_at} />,
                    },
                    {
                      key: 'actions',
                      title: '',
                      width: 80,
                      render: () => <ActionLink danger>Unlink</ActionLink>,
                    },
                  ]}
                />
              </Tabs.Panel>
            </Tabs>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className={classes.sidebar}>
          {/* Metadata Card */}
          <Paper className={classes.sidebarCard} mb="md">
            <Group gap="xs" className={classes.sidebarCardTitle}>
              <IconInfoCircle size={16} />
              <Text fw={600}>Metadata</Text>
            </Group>
            <div className={classes.metadataList}>
              <div className={classes.metadataItem}>
                <span className={classes.metadataLabel}>ID</span>
                <span className={classes.metadataValue}>{project.id}</span>
              </div>
              <div className={classes.metadataItem}>
                <span className={classes.metadataLabel}>Created</span>
                <span className={classes.metadataValue}>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <div className={classes.metadataItem}>
                <span className={classes.metadataLabel}>Updated</span>
                <span className={classes.metadataValue}>{new Date(project.updated_at).toLocaleDateString()}</span>
              </div>
              <div className={classes.metadataItem}>
                <span className={classes.metadataLabel}>Memory Count</span>
                <span className={classes.metadataValue}>{project.memory_count}</span>
              </div>
            </div>
          </Paper>

          {/* Repository Card */}
          {project.repo_name && (
            <Paper className={classes.sidebarCard} mb="md">
              <Group gap="xs" className={classes.sidebarCardTitle}>
                <IconBrandGithub size={16} />
                <Text fw={600}>Repository</Text>
              </Group>
              <a
                href={`https://github.com/${project.repo_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.repoName}
              >
                <IconBrandGithub size={20} />
                {project.repo_name}
              </a>
            </Paper>
          )}

          {/* Stats Card */}
          <Paper className={classes.sidebarCard}>
            <Group gap="xs" className={classes.sidebarCardTitle}>
              <IconChartBar size={16} />
              <Text fw={600}>Quick Stats</Text>
            </Group>
            <div className={classes.statsGrid}>
              <div className={classes.statItem}>
                <div className={classes.statValue} data-type="memory">{memoriesData?.total ?? 0}</div>
                <div className={classes.statLabel}>Memories</div>
              </div>
              <div className={classes.statItem}>
                <div className={classes.statValue} data-type="document">{documentsData?.total ?? 0}</div>
                <div className={classes.statLabel}>Documents</div>
              </div>
              <div className={classes.statItem}>
                <div className={classes.statValue} data-type="code">{codeArtifactsData?.total ?? 0}</div>
                <div className={classes.statLabel}>Code Artifacts</div>
              </div>
              <div className={classes.statItem}>
                <div className={classes.statValue} data-type="entity">{entitiesData?.total ?? 0}</div>
                <div className={classes.statLabel}>Entities</div>
              </div>
            </div>
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
