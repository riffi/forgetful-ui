import { useState } from 'react'
import {
  Modal,
  TextInput,
  Textarea,
  Slider,
  TagsInput,
  Button,
  Group,
  Stack,
  Text,
  Badge,
} from '@mantine/core'
import { IconBrain, IconDeviceFloppy, IconX } from '@tabler/icons-react'
import { useCreateMemory } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import type { MemoryCreate } from '@/types'
import classes from './CreateMemoryModal.module.css'

interface CreateMemoryModalProps {
  opened: boolean
  onClose: () => void
  onSuccess?: () => void
}

function getImportanceColor(value: number): string {
  if (value >= 9) return 'red'
  if (value >= 7) return 'yellow'
  return 'gray'
}

function getImportanceLabel(value: number): string {
  if (value >= 9) return 'Critical'
  if (value >= 7) return 'High'
  if (value >= 5) return 'Medium'
  return 'Low'
}

export function CreateMemoryModal({ opened, onClose, onSuccess }: CreateMemoryModalProps) {
  const createMemory = useCreateMemory()
  const { selectedProjectId } = useProjectContext()

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [context, setContext] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [importance, setImportance] = useState(7)

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = () => {
    setTitle('')
    setContent('')
    setContext('')
    setKeywords([])
    setTags([])
    setImportance(7)
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required'
    }

    if (!context.trim()) {
      newErrors.context = 'Context is required'
    }

    if (keywords.length === 0) {
      newErrors.keywords = 'At least one keyword is required'
    }

    if (tags.length === 0) {
      newErrors.tags = 'At least one tag is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const data: MemoryCreate = {
      title: title.trim(),
      content: content.trim(),
      context: context.trim(),
      keywords,
      tags,
      importance,
      project_id: selectedProjectId ?? undefined,
    }

    try {
      await createMemory.mutateAsync(data)
      resetForm()
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create memory:', error)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconBrain size={24} color="var(--accent-memory)" />
          <Text fw={600} size="lg">Create Memory</Text>
        </Group>
      }
      size="lg"
      centered
      classNames={{
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      <Stack gap="md">
        {/* Title */}
        <TextInput
          label="Title"
          placeholder="Concise, scannable title (5-50 words)"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          classNames={{ input: classes.input }}
        />

        {/* Content */}
        <Textarea
          label="Content"
          placeholder="ONE concept, self-contained (max ~400 words)"
          required
          minRows={4}
          autosize
          maxRows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={errors.content}
          classNames={{ input: classes.input }}
        />

        {/* Context */}
        <Textarea
          label="Context"
          placeholder="WHY this matters, HOW it relates to other concepts"
          required
          minRows={2}
          autosize
          maxRows={4}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          error={errors.context}
          classNames={{ input: classes.input }}
        />

        {/* Importance */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>Importance</Text>
            <Badge color={getImportanceColor(importance)} variant="light">
              {importance} - {getImportanceLabel(importance)}
            </Badge>
          </Group>
          <Slider
            value={importance}
            onChange={setImportance}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: 5, label: '5' },
              { value: 10, label: '10' },
            ]}
            color={getImportanceColor(importance)}
            classNames={{ root: classes.slider }}
          />
        </div>

        {/* Keywords */}
        <TagsInput
          label="Keywords"
          placeholder="Search terms for discovery (max 10)"
          required
          value={keywords}
          onChange={setKeywords}
          maxTags={10}
          error={errors.keywords}
          classNames={{ input: classes.input }}
        />

        {/* Tags */}
        <TagsInput
          label="Tags"
          placeholder="Categories for grouping (max 10)"
          required
          value={tags}
          onChange={setTags}
          maxTags={10}
          error={errors.tags}
          classNames={{ input: classes.input }}
        />

        {/* Actions */}
        <Group justify="flex-end" mt="md" className={classes.actions}>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconX size={16} />}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            color="purple"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSubmit}
            loading={createMemory.isPending}
            className={classes.submitBtn}
          >
            Create Memory
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
