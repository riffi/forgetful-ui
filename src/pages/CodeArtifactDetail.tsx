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
  TagsInput,
  Modal,
  Code,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCode,
  IconPencil,
  IconTrash,
  IconDeviceFloppy,
  IconX,
  IconArrowLeft,
  IconCalendar,
  IconHash,
  IconFolder,
  IconCopy,
} from '@tabler/icons-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useCodeArtifact, useUpdateCodeArtifact, useDeleteCodeArtifact } from '@/hooks'
import classes from './CodeArtifactDetail.module.css'

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'other', label: 'Other' },
]

function LanguageBadge({ language }: { language: string }) {
  const colorMap: Record<string, string> = {
    javascript: 'yellow',
    typescript: 'blue',
    python: 'green',
    rust: 'orange',
    go: 'cyan',
    java: 'red',
    c: 'gray',
    cpp: 'gray',
    csharp: 'violet',
    ruby: 'red',
    php: 'indigo',
    swift: 'orange',
    kotlin: 'violet',
    sql: 'blue',
    bash: 'gray',
  }

  return (
    <Badge size="lg" variant="light" color={colorMap[language] ?? 'gray'}>
      {language}
    </Badge>
  )
}

export function CodeArtifactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const artifactId = parseInt(id ?? '0')

  const { data: artifact, isLoading, isError } = useCodeArtifact(artifactId)
  const updateCodeArtifact = useUpdateCodeArtifact()
  const deleteCodeArtifact = useDeleteCodeArtifact()

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedCode, setEditedCode] = useState('')
  const [editedLanguage, setEditedLanguage] = useState('javascript')
  const [editedTags, setEditedTags] = useState<string[]>([])

  // Delete modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

  // Start editing
  const startEditing = () => {
    if (!artifact) return
    setEditedTitle(artifact.title)
    setEditedDescription(artifact.description)
    setEditedCode(artifact.code)
    setEditedLanguage(artifact.language)
    setEditedTags(artifact.tags ?? [])
    setIsEditing(true)
  }

  // Save changes
  const handleSave = async () => {
    await updateCodeArtifact.mutateAsync({
      id: artifactId,
      data: {
        title: editedTitle,
        description: editedDescription,
        code: editedCode,
        language: editedLanguage,
        tags: editedTags,
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
    await deleteCodeArtifact.mutateAsync(artifactId)
    closeDelete()
    navigate('/code-artifacts')
  }

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (artifact) {
      navigator.clipboard.writeText(artifact.code)
    }
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

  if (isError || !artifact) {
    return (
      <div className={classes.container}>
        <Paper className={classes.errorState}>
          <Stack align="center" gap="md">
            <IconCode size={48} color="var(--text-dimmed)" />
            <Title order={3}>Code Artifact not found</Title>
            <Text c="dimmed">The code artifact you're looking for doesn't exist.</Text>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/code-artifacts')}
            >
              Back to Code Artifacts
            </Button>
          </Stack>
        </Paper>
      </div>
    )
  }

  const breadcrumbs = [
    { title: 'Code Artifacts', href: '/code-artifacts' },
    { title: artifact.title, href: `/code-artifacts/${artifact.id}` },
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
            <IconCode size={32} color="var(--accent-code)" />
            {isEditing ? (
              <TextInput
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                size="lg"
                style={{ flex: 1 }}
                placeholder="Artifact title..."
              />
            ) : (
              <Title order={2} lineClamp={1} style={{ flex: 1 }}>
                {artifact.title}
              </Title>
            )}
          </Group>
          <Group gap="xs">
            <LanguageBadge language={artifact.language} />
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
                  color="cyan"
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={updateCodeArtifact.isPending}
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
          {/* Language */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Language</Text>
            {isEditing ? (
              <Select
                value={editedLanguage}
                onChange={(val) => setEditedLanguage(val ?? 'javascript')}
                data={LANGUAGE_OPTIONS}
                searchable
              />
            ) : (
              <LanguageBadge language={artifact.language} />
            )}
          </Paper>

          {/* Description */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Description</Text>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                minRows={2}
                autosize
                placeholder="Code artifact description..."
              />
            ) : (
              <Text className={classes.contentText}>
                {artifact.description || <span style={{ color: 'var(--text-dimmed)' }}>No description</span>}
              </Text>
            )}
          </Paper>

          {/* Code */}
          <Paper className={classes.section} mb="md">
            <Group justify="space-between" mb="sm">
              <Text className={classes.sectionLabel} mb={0}>Code</Text>
              {!isEditing && (
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconCopy size={14} />}
                  onClick={handleCopyCode}
                >
                  Copy
                </Button>
              )}
            </Group>
            {isEditing ? (
              <Textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                minRows={12}
                autosize
                placeholder="Enter your code..."
                styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
              />
            ) : (
              <Code block className={classes.codeContent}>
                {artifact.code}
              </Code>
            )}
          </Paper>

          {/* Tags */}
          <Paper className={classes.section}>
            <Text className={classes.sectionLabel}>Tags</Text>
            {isEditing ? (
              <TagsInput
                value={editedTags}
                onChange={setEditedTags}
                placeholder="Add tags..."
              />
            ) : (
              <Group gap="xs">
                {artifact.tags?.length ? (
                  artifact.tags.map((tag) => (
                    <Badge key={tag} variant="dot" color="cyan">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <Text c="dimmed">No tags</Text>
                )}
              </Group>
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
                  ID: {artifact.id}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCode size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Lines: {artifact.code.split('\n').length}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Created: {new Date(artifact.created_at).toLocaleString()}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Updated: {new Date(artifact.updated_at).toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Project */}
          {artifact.project && (
            <Paper className={classes.section} mb="md">
              <Text className={classes.sectionLabel}>Project</Text>
              <Paper
                className={classes.projectCard}
                onClick={() => navigate(`/projects/${artifact.project!.id}`)}
              >
                <Group gap="xs">
                  <IconFolder size={14} color="var(--accent-project)" />
                  <Text size="sm" fw={500}>
                    {artifact.project.name}
                  </Text>
                </Group>
              </Paper>
            </Paper>
          )}

          {/* Actions */}
          <Paper className={classes.section}>
            <Text className={classes.sectionLabel} mb="sm">
              Actions
            </Text>
            <Stack gap="xs">
              <Button
                variant="light"
                fullWidth
                leftSection={<IconCopy size={16} />}
                onClick={handleCopyCode}
              >
                Copy Code
              </Button>
            </Stack>
          </Paper>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete Code Artifact"
        centered
      >
        <Stack>
          <Text size="sm">
            Are you sure you want to delete "{artifact.title}"? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={closeDelete}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={deleteCodeArtifact.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}
