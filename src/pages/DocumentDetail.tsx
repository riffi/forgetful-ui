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
  IconFileText,
  IconPencil,
  IconTrash,
  IconDeviceFloppy,
  IconX,
  IconArrowLeft,
  IconCalendar,
  IconHash,
  IconFolder,
  IconFile,
} from '@tabler/icons-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useDocument, useUpdateDocument, useDeleteDocument } from '@/hooks'
import classes from './DocumentDetail.module.css'

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: 'Text' },
  { value: 'pdf', label: 'PDF' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'other', label: 'Other' },
]

function DocumentTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    markdown: 'blue',
    text: 'gray',
    pdf: 'red',
    html: 'orange',
    json: 'yellow',
    yaml: 'cyan',
  }

  return (
    <Badge size="lg" variant="light" color={colorMap[type] ?? 'gray'}>
      {type}
    </Badge>
  )
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const documentId = parseInt(id ?? '0')

  const { data: document, isLoading, isError } = useDocument(documentId)
  const updateDocument = useUpdateDocument()
  const deleteDocument = useDeleteDocument()

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedType, setEditedType] = useState('text')
  const [editedTags, setEditedTags] = useState<string[]>([])

  // Delete modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

  // Start editing
  const startEditing = () => {
    if (!document) return
    setEditedTitle(document.title)
    setEditedDescription(document.description)
    setEditedContent(document.content)
    setEditedType(document.document_type)
    setEditedTags(document.tags ?? [])
    setIsEditing(true)
  }

  // Save changes
  const handleSave = async () => {
    await updateDocument.mutateAsync({
      id: documentId,
      data: {
        title: editedTitle,
        description: editedDescription,
        content: editedContent,
        document_type: editedType,
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
    await deleteDocument.mutateAsync(documentId)
    closeDelete()
    navigate('/documents')
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

  if (isError || !document) {
    return (
      <div className={classes.container}>
        <Paper className={classes.errorState}>
          <Stack align="center" gap="md">
            <IconFileText size={48} color="var(--text-dimmed)" />
            <Title order={3}>Document not found</Title>
            <Text c="dimmed">The document you're looking for doesn't exist.</Text>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/documents')}
            >
              Back to Documents
            </Button>
          </Stack>
        </Paper>
      </div>
    )
  }

  const breadcrumbs = [
    { title: 'Documents', href: '/documents' },
    { title: document.title, href: `/documents/${document.id}` },
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
            <IconFileText size={32} color="var(--accent-document)" />
            {isEditing ? (
              <TextInput
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                size="lg"
                style={{ flex: 1 }}
                placeholder="Document title..."
              />
            ) : (
              <Title order={2} lineClamp={1} style={{ flex: 1 }}>
                {document.title}
              </Title>
            )}
          </Group>
          <Group gap="xs">
            <DocumentTypeBadge type={document.document_type} />
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
                  color="blue"
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={updateDocument.isPending}
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
          {/* Type */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Document Type</Text>
            {isEditing ? (
              <Select
                value={editedType}
                onChange={(val) => setEditedType(val ?? 'text')}
                data={DOCUMENT_TYPE_OPTIONS}
              />
            ) : (
              <DocumentTypeBadge type={document.document_type} />
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
                placeholder="Document description..."
              />
            ) : (
              <Text className={classes.contentText}>
                {document.description || <span style={{ color: 'var(--text-dimmed)' }}>No description</span>}
              </Text>
            )}
          </Paper>

          {/* Content */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Content</Text>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                minRows={10}
                autosize
                placeholder="Document content..."
                styles={{ input: { fontFamily: 'monospace' } }}
              />
            ) : (
              <Code block className={classes.codeContent}>
                {document.content}
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
                {document.tags?.length ? (
                  document.tags.map((tag) => (
                    <Badge key={tag} variant="dot" color="blue">
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
                  ID: {document.id}
                </Text>
              </Group>
              {document.filename && (
                <Group gap="xs">
                  <IconFile size={14} color="var(--text-dimmed)" />
                  <Text size="sm" c="dimmed">
                    {document.filename}
                  </Text>
                </Group>
              )}
              {document.size_bytes && (
                <Group gap="xs">
                  <IconFile size={14} color="var(--text-dimmed)" />
                  <Text size="sm" c="dimmed">
                    Size: {formatFileSize(document.size_bytes)}
                  </Text>
                </Group>
              )}
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Created: {new Date(document.created_at).toLocaleString()}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Updated: {new Date(document.updated_at).toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Project */}
          {document.project && (
            <Paper className={classes.section} mb="md">
              <Text className={classes.sectionLabel}>Project</Text>
              <Paper
                className={classes.projectCard}
                onClick={() => navigate(`/projects/${document.project!.id}`)}
              >
                <Group gap="xs">
                  <IconFolder size={14} color="var(--accent-project)" />
                  <Text size="sm" fw={500}>
                    {document.project.name}
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
                color="gray"
                onClick={() => {
                  // Copy content to clipboard
                  navigator.clipboard.writeText(document.content)
                }}
              >
                Copy Content
              </Button>
            </Stack>
          </Paper>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete Document"
        centered
      >
        <Stack>
          <Text size="sm">
            Are you sure you want to delete "{document.title}"? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={closeDelete}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={deleteDocument.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}
