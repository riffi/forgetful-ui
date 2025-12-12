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
  IconTrash,
  IconDeviceFloppy,
  IconArrowLeft,
  IconBox,
  IconPlus,
  IconChevronDown,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMemory, useUpdateMemory, useDeleteMemory, useMemoryLinks, useEntities, useLinkEntityToMemory } from '@/hooks'
import { Breadcrumb, Card, Section, TagsEditor } from '@/components/ui'
import classes from './MemoryDetail.module.css'

// Importance badge with dropdown
function ImportanceBadgeDropdown({ importance, onChange }: { importance: number; onChange: (value: number) => void }) {
  const getBadgeClass = (val: number) => {
    if (val >= 9) return classes.importanceBadgeHigh
    if (val >= 7) return classes.importanceBadgeMedium
    return classes.importanceBadgeLow
  }

  const getLabel = (val: number) => {
    if (val >= 9) return 'Critical'
    if (val >= 7) return 'Important'
    return 'Low Priority'
  }

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Badge
          className={getBadgeClass(importance)}
          size="lg"
          rightSection={<IconChevronDown size={10} />}
          style={{ cursor: 'pointer' }}
        >
          Importance: {importance} ({getLabel(importance)})
        </Badge>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Select Importance</Menu.Label>
        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(val => (
          <Menu.Item
            key={val}
            onClick={() => onChange(val)}
            className={val === importance ? classes.menuItemActive : undefined}
          >
            {val} - {val >= 9 ? 'Critical' : val >= 7 ? 'Important' : 'Low Priority'}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

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

// Inline editable content area
function EditableContent({ value, onChange, placeholder, minHeight }: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}) {
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
      style={minHeight ? { minHeight } : undefined}
    >
      {value || ''}
    </div>
  )
}

export function MemoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const memoryId = parseInt(id ?? '0')

  const { data: memory, isLoading, isError } = useMemory(memoryId)
  const { data: linksData } = useMemoryLinks(memoryId)
  const updateMemory = useUpdateMemory()
  const deleteMemory = useDeleteMemory()

  // Local edit state (inline editing - no separate edit mode)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedContext, setEditedContext] = useState('')
  const [editedKeywords, setEditedKeywords] = useState<string[]>([])
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [editedImportance, setEditedImportance] = useState(7)

  // Delete modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
  const [deleteReason, setDeleteReason] = useState('')

  // Link entity modal
  const [linkEntityOpened, { close: closeLinkEntity }] = useDisclosure(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const { data: entitiesData } = useEntities({ limit: 100 })
  const linkEntityToMemory = useLinkEntityToMemory()

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

  // Handle delete
  const handleDelete = async () => {
    await deleteMemory.mutateAsync({
      id: memoryId,
      reason: deleteReason || undefined,
    })
    closeDelete()
    navigate('/memories')
  }

  // Handle mark obsolete
  const handleMarkObsolete = async () => {
    await updateMemory.mutateAsync({
      id: memoryId,
      data: { is_obsolete: true },
    })
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
          {/* Badges row */}
          <Group gap="xs" mb="xs">
            <Badge variant="light" color="purple" size="lg" leftSection={<IconBrain size={12} />}>
              Memory
            </Badge>
            <ImportanceBadgeDropdown
              importance={editedImportance}
              onChange={setEditedImportance}
            />
            {memory.is_obsolete && (
              <Badge color="gray" variant="outline" size="lg">
                Obsolete
              </Badge>
            )}
          </Group>

          {/* Title row - inline editable */}
          <EditableTitle value={editedTitle} onChange={setEditedTitle} />
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
            leftSection={<IconAlertCircle size={16} />}
            onClick={handleMarkObsolete}
            disabled={memory.is_obsolete}
          >
            Mark Obsolete
          </Button>
          <Button
            color="purple"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={updateMemory.isPending}
            disabled={!hasChanges}
            className={classes.btnPrimary}
          >
            Save Changes
          </Button>
        </Group>
      </div>

      {/* Main Content Grid */}
      <div className={classes.grid}>
        {/* Left Column - Content */}
        <div className={classes.mainColumn}>
          {/* Content - inline editable */}
          <Paper className={classes.contentCard} mb="md">
            <Text className={classes.cardLabel}>Content</Text>
            <EditableContent
              value={editedContent}
              onChange={setEditedContent}
              placeholder="Add memory content..."
              minHeight={150}
            />
          </Paper>

          {/* Context - inline editable */}
          <Paper className={classes.contentCard} mb="md">
            <Text className={classes.cardLabel}>Context</Text>
            <EditableContent
              value={editedContext}
              onChange={setEditedContext}
              placeholder="Add context about this memory..."
              minHeight={80}
            />
          </Paper>

          {/* Keywords & Tags */}
          <Section title="Keywords & Tags">
            <Group gap="xl" grow>
              <div>
                <Text className={classes.fieldLabel}>Keywords</Text>
                <TagsEditor
                  value={editedKeywords}
                  onChange={setEditedKeywords}
                  placeholder="Add keywords..."
                  variant="keyword"
                  accentColor="memory"
                />
              </div>
              <div>
                <Text className={classes.fieldLabel}>Tags</Text>
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
                    onClick={() => navigate(`/projects/${projectId}`)}
                  >
                    <div className={`${classes.linkedItemDot} ${classes.linkedItemDot}.project`} style={{ background: 'var(--accent-project)' }} />
                    <div className={classes.linkedItemContent}>
                      <div className={classes.linkedItemTitle}>Project #{projectId}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <Text size="sm" c="dimmed">No linked projects</Text>
            )}
            <button className={classes.addLinkBtn}>
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
            <button className={classes.addLinkBtn}>
              <IconPlus size={14} />
              Link memory
            </button>
          </Card>

          {/* Linked Documents */}
          <Card title="Linked Documents">
            <Text size="sm" c="dimmed">No linked documents</Text>
            <button className={classes.addLinkBtn}>
              <IconPlus size={14} />
              Link document
            </button>
          </Card>

          {/* Linked Code Artifacts */}
          <Card title="Linked Code Artifacts">
            <Text size="sm" c="dimmed">No linked code artifacts</Text>
            <button className={classes.addLinkBtn}>
              <IconPlus size={14} />
              Link code artifact
            </button>
          </Card>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Mark as Obsolete"
        centered
      >
        <Stack>
          <Text size="sm">
            Are you sure you want to mark "{memory.title}" as obsolete? This
            won't delete it permanently.
          </Text>
          <Select
            label="Reason (optional)"
            placeholder="Why is this memory obsolete?"
            data={[
              { value: 'outdated', label: 'Information is outdated' },
              { value: 'incorrect', label: 'Information was incorrect' },
              { value: 'superseded', label: 'Superseded by another memory' },
              { value: 'no-longer-relevant', label: 'No longer relevant' },
            ]}
            value={deleteReason}
            onChange={(val) => setDeleteReason(val ?? '')}
            clearable
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={closeDelete}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={deleteMemory.isPending}
            >
              Mark Obsolete
            </Button>
          </Group>
        </Stack>
      </Modal>

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
    </div>
  )
}
