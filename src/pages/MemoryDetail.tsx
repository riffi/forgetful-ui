import { useState, useRef, useEffect } from 'react'
import {
  Text,
  Group,
  Stack,
  Paper,
  Badge,
  Button,
  Skeleton,
  Modal,
  Select,
  Menu,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBrain,
  IconDeviceFloppy,
  IconArrowLeft,
  IconBox,
  IconPlus,
  IconChevronDown,
  IconAlertCircle,
  IconShare3,
  IconDotsVertical,
  IconFolder,
  IconX,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMemory, useUpdateMemory, useMemoryLinks, useEntities, useLinkEntityToMemory, useProjects, useDocuments, useCodeArtifacts } from '@/hooks'
import { Breadcrumb, Card, Section, TagsEditor, MarkdownEditor } from '@/components/ui'
import { ConfirmDialog } from '@/components/modals'
import classes from './MemoryDetail.module.css'

// Inline editable title component
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

export function MemoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const memoryId = parseInt(id ?? '0')

  const { data: memory, isLoading, isError } = useMemory(memoryId)
  const { data: linksData } = useMemoryLinks(memoryId)
  const updateMemory = useUpdateMemory()

  // Obsolete confirmation dialog
  const [obsoleteDialogOpened, setObsoleteDialogOpened] = useState(false)

  // Local edit state (inline editing - no separate edit mode)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedContext, setEditedContext] = useState('')
  const [editedKeywords, setEditedKeywords] = useState<string[]>([])
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [editedImportance, setEditedImportance] = useState(7)

  // Link entity modal
  const [linkEntityOpened, { close: closeLinkEntity }] = useDisclosure(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const { data: entitiesData } = useEntities({ limit: 100 })
  const { data: projectsData } = useProjects({ limit: 100 })
  const linkEntityToMemory = useLinkEntityToMemory()

  // Link project modal
  const [linkProjectOpened, setLinkProjectOpened] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Unlink project dialog
  const [unlinkProjectTarget, setUnlinkProjectTarget] = useState<{ id: number; name: string } | null>(null)

  const { data: documentsData } = useDocuments({ limit: 100 })
  const { data: codeArtifactsData } = useCodeArtifacts({ limit: 100 })

  // Create maps for quick lookup by id
  const projectsMap = new Map(
    (projectsData?.projects ?? []).map(p => [p.id, p.name])
  )
  const documentsMap = new Map(
    (documentsData?.documents ?? []).map(d => [d.id, d.title])
  )
  const codeArtifactsMap = new Map(
    (codeArtifactsData?.code_artifacts ?? []).map(c => [c.id, { title: c.title, language: c.language }])
  )

  // Initialize edit state from memory data
  useEffect(() => {
    if (memory) {
      setEditedTitle(memory.title)
      setEditedContent(memory.content)
      setEditedContext(memory.context)
      setEditedKeywords(memory.keywords ?? [])
      setEditedTags(memory.tags ?? [])
      setEditedImportance(memory.importance)
    }
  }, [memory])

  // Check if there are unsaved changes
  const hasChanges = memory && (
    editedTitle !== memory.title ||
    editedContent !== memory.content ||
    editedContext !== memory.context ||
    editedImportance !== memory.importance ||
    JSON.stringify(editedKeywords) !== JSON.stringify(memory.keywords ?? []) ||
    JSON.stringify(editedTags) !== JSON.stringify(memory.tags ?? [])
  )

  // Get entity options for select
  const entityOptions = (entitiesData?.entities ?? []).map(e => ({
    value: String(e.id),
    label: `${e.name} (${e.entity_type})`,
  }))

  // Handle link entity
  const handleLinkEntity = async () => {
    if (!selectedEntityId) return

    await linkEntityToMemory.mutateAsync({
      entityId: parseInt(selectedEntityId),
      memoryId,
    })
    setSelectedEntityId(null)
    closeLinkEntity()
  }

  // Save changes
  const handleSave = async () => {
    await updateMemory.mutateAsync({
      id: memoryId,
      data: {
        title: editedTitle,
        content: editedContent,
        context: editedContext,
        keywords: editedKeywords,
        tags: editedTags,
        importance: editedImportance,
      },
    })
  }

  // Handle mark obsolete
  const handleMarkObsolete = () => {
    setObsoleteDialogOpened(true)
  }

  const handleObsoleteConfirm = async () => {
    await updateMemory.mutateAsync({
      id: memoryId,
      data: { is_obsolete: true },
    })
    setObsoleteDialogOpened(false)
  }

  // Handle link project
  const handleLinkProject = async () => {
    if (!selectedProjectId || !memory) return
    const currentProjectIds = memory.project_ids || []
    const newProjectId = parseInt(selectedProjectId, 10)
    if (!currentProjectIds.includes(newProjectId)) {
      await updateMemory.mutateAsync({
        id: memoryId,
        data: { project_ids: [...currentProjectIds, newProjectId] },
      })
    }
    setSelectedProjectId(null)
    setLinkProjectOpened(false)
  }

  // Get available projects (not already linked)
  const availableProjects = (projectsData?.projects ?? [])
    .filter(p => !memory?.project_ids?.includes(p.id))
    .map(p => ({ value: String(p.id), label: p.name }))

  // Handle unlink project
  const handleUnlinkProject = async () => {
    if (!unlinkProjectTarget || !memory) return
    const newProjectIds = (memory.project_ids || []).filter(id => id !== unlinkProjectTarget.id)
    await updateMemory.mutateAsync({
      id: memoryId,
      data: { project_ids: newProjectIds },
    })
    setUnlinkProjectTarget(null)
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

  if (isError || !memory) {
    return (
      <div className={classes.container}>
        <Paper className={classes.errorState}>
          <Stack align="center" gap="md">
            <IconBrain size={48} color="var(--text-dimmed)" />
            <Text size="xl" fw={600}>Memory not found</Text>
            <Text c="dimmed">The memory you're looking for doesn't exist.</Text>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/memories')}
            >
              Back to Memories
            </Button>
          </Stack>
        </Paper>
      </div>
    )
  }

  const breadcrumbItems = [
    { title: 'Memories', href: '/memories' },
    { title: memory.title, href: `/memories/${memory.id}` },
  ]

  return (
    <div className={classes.container}>
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className={classes.pageHeader}>
        <div className={classes.headerMain}>
          <div className={classes.titleRow}>
            <div className={classes.accentBar} />
            <div className={classes.titleContent}>
              <div className={classes.titleMeta}>
                <IconBrain size={14} className={classes.typeIcon} />
                <span className={classes.typeLabel}>Memory</span>
                {memory.is_obsolete && (
                  <Badge color="gray" variant="outline" size="xs" className={classes.obsoleteBadge}>
                    Obsolete
                  </Badge>
                )}
              </div>
              <EditableTitle value={editedTitle} onChange={setEditedTitle} />
            </div>
          </div>
        </div>

        <div className={classes.headerActions}>
          <button
            className={classes.actionBtn}
            onClick={() => navigate(`/graph?focus=memory_${memory.id}`)}
            title="View in Graph"
          >
            <IconShare3 size={18} />
          </button>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <button className={classes.actionBtn} title="More actions">
                <IconDotsVertical size={18} />
              </button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconAlertCircle size={16} />}
                onClick={handleMarkObsolete}
                disabled={memory.is_obsolete}
              >
                Mark Obsolete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <button
            className={`${classes.saveBtn} ${hasChanges ? classes.saveBtnActive : ''}`}
            onClick={handleSave}
            disabled={!hasChanges || updateMemory.isPending}
          >
            <IconDeviceFloppy size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={classes.grid}>
        {/* Left Column - Content */}
        <div className={classes.mainColumn}>
          {/* Content */}
          <MarkdownEditor
            label="Content"
            value={editedContent}
            onChange={setEditedContent}
            placeholder="Add memory content..."
            minHeight={150}
            accentColor="memory"
          />

          {/* Context */}
          <MarkdownEditor
            label="Context"
            value={editedContext}
            onChange={setEditedContext}
            placeholder="Add context about this memory..."
            minHeight={80}
            accentColor="memory"
          />

          {/* Keywords & Tags */}
          <Section title="Keywords & Tags">
            <Group gap="xl" grow>
              <div>
                <span className={classes.fieldLabel}>Keywords</span>
                <TagsEditor
                  value={editedKeywords}
                  onChange={setEditedKeywords}
                  placeholder="Add keywords..."
                  variant="keyword"
                  accentColor="memory"
                />
              </div>
              <div>
                <span className={classes.fieldLabel}>Tags</span>
                <TagsEditor
                  value={editedTags}
                  onChange={setEditedTags}
                  placeholder="Add tags..."
                  variant="memory"
                  accentColor="memory"
                />
              </div>
            </Group>
          </Section>
        </div>

        {/* Right Column - Sidebar */}
        <div className={classes.sidebar}>
          {/* Metadata */}
          <Card title="Metadata">
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>ID</span>
              <span className={classes.metadataValue}>#{memory.id}</span>
            </div>
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>Importance</span>
              <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                  <Badge
                    className={
                      editedImportance >= 9 ? classes.importanceBadgeHigh :
                      editedImportance >= 7 ? classes.importanceBadgeMedium :
                      classes.importanceBadgeLow
                    }
                    size="sm"
                    rightSection={<IconChevronDown size={10} />}
                    style={{ cursor: 'pointer' }}
                  >
                    {editedImportance}
                  </Badge>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Select Importance</Menu.Label>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(val => (
                    <Menu.Item
                      key={val}
                      onClick={() => setEditedImportance(val)}
                      className={val === editedImportance ? classes.menuItemActive : undefined}
                    >
                      {val} - {val >= 9 ? 'Critical' : val >= 7 ? 'Important' : 'Low Priority'}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </div>
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>Created</span>
              <span className={classes.metadataValue}>
                {new Date(memory.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>Updated</span>
              <span className={classes.metadataValue}>
                {new Date(memory.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </Card>

          {/* Linked Projects */}
          <Card title="Linked Projects">
            {memory.project_ids?.length ? (
              <>
                {memory.project_ids.slice(0, 3).map((projectId) => (
                  <div
                    key={projectId}
                    className={classes.linkedItem}
                  >
                    <div
                      className={classes.linkedItemClickable}
                      onClick={() => navigate(`/projects/${projectId}`)}
                    >
                      <div className={`${classes.linkedItemDot} ${classes.linkedItemDot}.project`} style={{ background: 'var(--accent-project)' }} />
                      <div className={classes.linkedItemContent}>
                        <div className={classes.linkedItemTitle}>{projectsMap.get(projectId) ?? `Project #${projectId}`}</div>
                      </div>
                    </div>
                    <button
                      className={classes.linkedItemRemove}
                      onClick={(e) => {
                        e.stopPropagation()
                        setUnlinkProjectTarget({ id: projectId, name: projectsMap.get(projectId) ?? `Project #${projectId}` })
                      }}
                      title="Unlink project"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                ))}
                {memory.project_ids.length > 3 && (
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    +{memory.project_ids.length - 3} more
                  </Text>
                )}
              </>
            ) : (
              <Text size="sm" c="dimmed">No linked projects</Text>
            )}
            <button
              className={classes.addLinkBtn}
              onClick={() => setLinkProjectOpened(true)}
              disabled={availableProjects.length === 0}
            >
              <IconPlus size={14} />
              Add project link
            </button>
          </Card>

          {/* Linked Memories */}
          <Card title="Linked Memories">
            {linksData?.linked_memories?.length ? (
              <>
                {linksData.linked_memories.slice(0, 5).map((linked) => (
                  <div
                    key={linked.id}
                    className={classes.linkedItem}
                    onClick={() => navigate(`/memories/${linked.id}`)}
                  >
                    <div className={`${classes.linkedItemDot}`} style={{ background: 'var(--accent-memory)' }} />
                    <div className={classes.linkedItemContent}>
                      <div className={classes.linkedItemTitle}>{linked.title}</div>
                      <div className={classes.linkedItemMeta}>Importance: {linked.importance}</div>
                    </div>
                  </div>
                ))}
                {linksData.linked_memories.length > 5 && (
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    +{linksData.linked_memories.length - 5} more
                  </Text>
                )}
              </>
            ) : (
              <Text size="sm" c="dimmed">No linked memories</Text>
            )}
          </Card>

          {/* Linked Documents */}
          <Card title="Linked Documents">
            {memory.document_ids?.length ? (
              <>
                {memory.document_ids.slice(0, 3).map((docId) => (
                  <div
                    key={docId}
                    className={classes.linkedItem}
                    onClick={() => navigate(`/documents/${docId}`)}
                  >
                    <div className={classes.linkedItemDot} style={{ background: 'var(--accent-document)' }} />
                    <div className={classes.linkedItemContent}>
                      <div className={classes.linkedItemTitle}>{documentsMap.get(docId) ?? `Document #${docId}`}</div>
                    </div>
                  </div>
                ))}
                {memory.document_ids.length > 3 && (
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    +{memory.document_ids.length - 3} more
                  </Text>
                )}
              </>
            ) : (
              <Text size="sm" c="dimmed">No linked documents</Text>
            )}
            <button className={classes.addLinkBtn}>
              <IconPlus size={14} />
              Link document
            </button>
          </Card>

          {/* Linked Code Artifacts */}
          <Card title="Linked Code Artifacts">
            {memory.code_artifact_ids?.length ? (
              <>
                {memory.code_artifact_ids.slice(0, 3).map((artifactId) => {
                  const artifact = codeArtifactsMap.get(artifactId)
                  return (
                    <div
                      key={artifactId}
                      className={classes.linkedItem}
                      onClick={() => navigate(`/code-artifacts/${artifactId}`)}
                    >
                      <div className={classes.linkedItemDot} style={{ background: 'var(--accent-code)' }} />
                      <div className={classes.linkedItemContent}>
                        <div className={classes.linkedItemTitle}>{artifact?.title ?? `Code Artifact #${artifactId}`}</div>
                        {artifact?.language && (
                          <div className={classes.linkedItemMeta}>{artifact.language}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {memory.code_artifact_ids.length > 3 && (
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    +{memory.code_artifact_ids.length - 3} more
                  </Text>
                )}
              </>
            ) : (
              <Text size="sm" c="dimmed">No linked code artifacts</Text>
            )}
            <button className={classes.addLinkBtn}>
              <IconPlus size={14} />
              Link code artifact
            </button>
          </Card>
        </div>
      </div>

      {/* Link Entity Modal */}
      <Modal
        opened={linkEntityOpened}
        onClose={closeLinkEntity}
        title={
          <Group gap="xs">
            <IconBox size={20} color="var(--accent-entity)" />
            <Text fw={600}>Link Entity to Memory</Text>
          </Group>
        }
        centered
      >
        <Stack>
          <Select
            label="Select Entity"
            placeholder="Search for an entity..."
            data={entityOptions}
            value={selectedEntityId}
            onChange={setSelectedEntityId}
            searchable
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={closeLinkEntity}>
              Cancel
            </Button>
            <Button
              color="orange"
              leftSection={<IconPlus size={16} />}
              onClick={handleLinkEntity}
              loading={linkEntityToMemory.isPending}
              disabled={!selectedEntityId}
            >
              Link Entity
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Link Project Modal */}
      <Modal
        opened={linkProjectOpened}
        onClose={() => setLinkProjectOpened(false)}
        title={
          <Group gap="xs">
            <IconFolder size={20} color="var(--accent-project)" />
            <Text fw={600}>Link Project to Memory</Text>
          </Group>
        }
        centered
      >
        <Stack>
          <Select
            label="Select Project"
            placeholder="Search for a project..."
            data={availableProjects}
            value={selectedProjectId}
            onChange={setSelectedProjectId}
            searchable
            clearable
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={() => setLinkProjectOpened(false)}>
              Cancel
            </Button>
            <Button
              color="green"
              leftSection={<IconPlus size={16} />}
              onClick={handleLinkProject}
              loading={updateMemory.isPending}
              disabled={!selectedProjectId}
            >
              Link Project
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Mark Obsolete Confirmation */}
      <ConfirmDialog
        opened={obsoleteDialogOpened}
        onClose={() => setObsoleteDialogOpened(false)}
        onConfirm={handleObsoleteConfirm}
        title="Mark as Obsolete"
        message={`Are you sure you want to mark "${memory.title}" as obsolete? This will hide the memory from search results but won't delete it permanently.`}
        confirmText="Mark Obsolete"
        confirmColor="red"
        icon={<IconAlertCircle size={24} color="var(--mantine-color-red-6)" />}
        isLoading={updateMemory.isPending}
      />

      {/* Unlink Project Confirmation */}
      <ConfirmDialog
        opened={unlinkProjectTarget !== null}
        onClose={() => setUnlinkProjectTarget(null)}
        onConfirm={handleUnlinkProject}
        title="Unlink Project"
        message={`Remove "${unlinkProjectTarget?.name}" from this memory?`}
        confirmText="Unlink"
        confirmColor="red"
        icon={<IconFolder size={24} color="var(--mantine-color-red-6)" />}
        isLoading={updateMemory.isPending}
      />
    </div>
  )
}
