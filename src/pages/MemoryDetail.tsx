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
  Slider,
  Skeleton,
  TagsInput,
  Modal,
  Box,
  Select,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBrain,
  IconPencil,
  IconTrash,
  IconDeviceFloppy,
  IconX,
  IconLink,
  IconArrowLeft,
  IconBox,
  IconPlus,
  IconFileText,
  IconCode,
  IconFolder,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMemory, useUpdateMemory, useDeleteMemory, useMemoryLinks, useEntities, useLinkEntityToMemory } from '@/hooks'
import { Breadcrumb, Card, Section } from '@/components/ui'
import type { Memory } from '@/types'
import classes from './MemoryDetail.module.css'

function ImportanceBadge({ importance }: { importance: number }) {
  let color = 'gray'
  if (importance >= 9) color = 'red'
  else if (importance >= 7) color = 'yellow'

  return (
    <Badge size="lg" variant="light" color={color}>
      Importance: {importance}
    </Badge>
  )
}

function LinkedMemoryCard({ memory }: { memory: Memory }) {
  const navigate = useNavigate()

  return (
    <Paper
      className={classes.linkedItem}
      onClick={() => navigate(`/memories/${memory.id}`)}
    >
      <Group gap="xs" wrap="nowrap">
        <IconBrain size={14} color="var(--accent-memory)" />
        <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
          {memory.title}
        </Text>
        <ImportanceBadge importance={memory.importance} />
      </Group>
    </Paper>
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

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
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
  const [linkEntityOpened, { open: openLinkEntity, close: closeLinkEntity }] = useDisclosure(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const { data: entitiesData } = useEntities({ limit: 100 })
  const linkEntityToMemory = useLinkEntityToMemory()

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

  // Start editing
  const startEditing = () => {
    if (!memory) return
    setEditedTitle(memory.title)
    setEditedContent(memory.content)
    setEditedContext(memory.context)
    setEditedKeywords(memory.keywords ?? [])
    setEditedTags(memory.tags ?? [])
    setEditedImportance(memory.importance)
    setIsEditing(true)
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
    setIsEditing(false)
  }

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false)
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
            <Title order={3}>Memory not found</Title>
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
      <Paper className={classes.header} mb="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <IconBrain size={32} color="var(--accent-memory)" />
            {isEditing ? (
              <TextInput
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                size="lg"
                style={{ flex: 1 }}
                placeholder="Memory title..."
              />
            ) : (
              <Title order={2} lineClamp={1} style={{ flex: 1 }}>
                {memory.title}
              </Title>
            )}
          </Group>
          <Group gap="xs">
            {memory.is_obsolete && (
              <Badge color="gray" variant="outline" size="lg">
                Obsolete
              </Badge>
            )}
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
                  color="purple"
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={updateMemory.isPending}
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
          {/* Importance */}
          <Section title="Importance">
            {isEditing ? (
              <Stack gap="xs">
                <Slider
                  value={editedImportance}
                  onChange={setEditedImportance}
                  min={1}
                  max={10}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                  ]}
                  color={
                    editedImportance >= 9
                      ? 'red'
                      : editedImportance >= 7
                      ? 'yellow'
                      : 'gray'
                  }
                />
                <Text size="sm" c="dimmed" ta="center">
                  {editedImportance >= 9
                    ? 'Critical / Foundational'
                    : editedImportance >= 7
                    ? 'Important / Useful'
                    : 'Lower Priority'}
                </Text>
              </Stack>
            ) : (
              <ImportanceBadge importance={memory.importance} />
            )}
          </Section>

          {/* Content */}
          <Section title="Content">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                minRows={6}
                autosize
                placeholder="Memory content..."
              />
            ) : (
              <Text className={classes.contentText}>{memory.content}</Text>
            )}
          </Section>

          {/* Context */}
          <Section title="Context">
            {isEditing ? (
              <Textarea
                value={editedContext}
                onChange={(e) => setEditedContext(e.target.value)}
                minRows={3}
                autosize
                placeholder="Why this matters, how it relates to other concepts..."
              />
            ) : (
              <Text className={classes.contentText}>{memory.context}</Text>
            )}
          </Section>

          {/* Keywords & Tags */}
          <Section title="Keywords & Tags">
            <Group gap="xl">
              <Box style={{ flex: 1 }}>
                <Text className={classes.fieldLabel}>Keywords</Text>
                {isEditing ? (
                  <TagsInput
                    value={editedKeywords}
                    onChange={setEditedKeywords}
                    placeholder="Add keywords..."
                  />
                ) : (
                  <Group gap="xs">
                    {memory.keywords?.map((kw) => (
                      <Badge key={kw} variant="outline" color="gray">
                        {kw}
                      </Badge>
                    )) ?? <Text c="dimmed">No keywords</Text>}
                  </Group>
                )}
              </Box>
              <Box style={{ flex: 1 }}>
                <Text className={classes.fieldLabel}>Tags</Text>
                {isEditing ? (
                  <TagsInput
                    value={editedTags}
                    onChange={setEditedTags}
                    placeholder="Add tags..."
                  />
                ) : (
                  <Group gap="xs">
                    {memory.tags?.map((tag) => (
                      <Badge key={tag} variant="dot" color="purple">
                        {tag}
                      </Badge>
                    )) ?? <Text c="dimmed">No tags</Text>}
                  </Group>
                )}
              </Box>
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
          <Textarea
            label="Reason (optional)"
            placeholder="Why is this memory obsolete?"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
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
              leftSection={<IconLink size={16} />}
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
