import { useState } from 'react'
import {
  Title,
  Text,
  Group,
  Stack,
  Paper,
  Badge,
  Button,
  ActionIcon,
  TextInput,
  Textarea,
  Slider,
  Breadcrumbs,
  Anchor,
  Skeleton,
  TagsInput,
  Tooltip,
  Modal,
  Box,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBrain,
  IconPencil,
  IconTrash,
  IconShare3,
  IconDeviceFloppy,
  IconX,
  IconLink,
  IconArrowLeft,
  IconCalendar,
  IconHash,
} from '@tabler/icons-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMemory, useUpdateMemory, useDeleteMemory, useMemoryLinks } from '@/hooks'
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

  const breadcrumbs = [
    { title: 'Memories', href: '/memories' },
    { title: memory.title, href: `/memories/${memory.id}` },
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
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Importance</Text>
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
          </Paper>

          {/* Content */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Content</Text>
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
          </Paper>

          {/* Context */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Context</Text>
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
          </Paper>

          {/* Keywords & Tags */}
          <Paper className={classes.section}>
            <Group gap="xl">
              <Box style={{ flex: 1 }}>
                <Text className={classes.sectionLabel}>Keywords</Text>
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
                <Text className={classes.sectionLabel}>Tags</Text>
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
                  ID: {memory.id}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Created: {new Date(memory.created_at).toLocaleString()}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Updated: {new Date(memory.updated_at).toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Linked Memories */}
          <Paper className={classes.section} mb="md">
            <Group justify="space-between" mb="sm">
              <Text className={classes.sectionLabel}>Linked Memories</Text>
              <Tooltip label="View in Graph">
                <ActionIcon
                  variant="subtle"
                  onClick={() => navigate(`/graph?memory=${memory.id}`)}
                >
                  <IconShare3 size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            {linksData?.linked_memories?.length ? (
              <Stack gap="xs">
                {linksData.linked_memories.slice(0, 5).map((linked) => (
                  <LinkedMemoryCard key={linked.id} memory={linked} />
                ))}
                {linksData.linked_memories.length > 5 && (
                  <Text size="sm" c="dimmed" ta="center">
                    +{linksData.linked_memories.length - 5} more
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No linked memories
              </Text>
            )}
          </Paper>

          {/* Actions */}
          <Paper className={classes.section}>
            <Text className={classes.sectionLabel} mb="sm">
              Actions
            </Text>
            <Stack gap="xs">
              <Button
                variant="light"
                leftSection={<IconShare3 size={16} />}
                fullWidth
                onClick={() => navigate(`/graph?memory=${memory.id}`)}
              >
                View in Graph
              </Button>
              <Button
                variant="light"
                leftSection={<IconLink size={16} />}
                fullWidth
                color="gray"
              >
                Add Link
              </Button>
            </Stack>
          </Paper>
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
    </div>
  )
}
