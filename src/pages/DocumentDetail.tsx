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
  Menu,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconFileText,
  IconTrash,
  IconDeviceFloppy,
  IconArrowLeft,
  IconCalendar,
  IconHash,
  IconFolder,
  IconFile,
  IconChevronDown,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDocument, useUpdateDocument, useDeleteDocument } from '@/hooks'
import { Breadcrumb, Card, MarkdownEditor, TagsEditor } from '@/components/ui'
import classes from './DocumentDetail.module.css'

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'markdown', label: 'Markdown', color: 'blue' },
  { value: 'text', label: 'Text', color: 'gray' },
  { value: 'pdf', label: 'PDF', color: 'red' },
  { value: 'html', label: 'HTML', color: 'orange' },
  { value: 'json', label: 'JSON', color: 'yellow' },
  { value: 'yaml', label: 'YAML', color: 'cyan' },
  { value: 'other', label: 'Other', color: 'gray' },
]

function formatFileSize(bytes?: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Document type badge with dropdown
function DocumentTypeBadgeDropdown({ type, onChange }: { type: string; onChange: (type: string) => void }) {
  const typeOption = DOCUMENT_TYPE_OPTIONS.find(t => t.value === type) ?? DOCUMENT_TYPE_OPTIONS[6]

  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Badge
          className={classes.clickableBadge}
          variant="light"
          color={typeOption.color}
          size="lg"
          rightSection={<IconChevronDown size={10} />}
        >
          {typeOption.label}
        </Badge>
      </Menu.Target>
      <Menu.Dropdown>
        {DOCUMENT_TYPE_OPTIONS.map(opt => (
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

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const documentId = parseInt(id ?? '0')

  const { data: document, isLoading, isError } = useDocument(documentId)
  const updateDocument = useUpdateDocument()
  const deleteDocument = useDeleteDocument()

  // Local edit state (inline editing - no separate edit mode)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedType, setEditedType] = useState('text')
  const [editedTags, setEditedTags] = useState<string[]>([])

  // Delete modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

  // Initialize edit state from document data
  useEffect(() => {
    if (document) {
      setEditedTitle(document.title)
      setEditedDescription(document.description)
      setEditedContent(document.content)
      setEditedType(document.document_type)
      setEditedTags(document.tags ?? [])
    }
  }, [document])

  // Check if there are unsaved changes
  const hasChanges = document && (
    editedTitle !== document.title ||
    editedDescription !== document.description ||
    editedContent !== document.content ||
    editedType !== document.document_type ||
    JSON.stringify(editedTags) !== JSON.stringify(document.tags ?? [])
  )

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
            <Text size="xl" fw={600}>Document not found</Text>
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

  const breadcrumbItems = [
    { title: 'Documents', href: '/documents' },
    { title: document.title, href: `/documents/${document.id}` },
  ]

  return (
    <div className={classes.container}>
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className={classes.pageHeader}>
        <div className={classes.headerMain}>
          {/* Badges row */}
          <Group gap="xs" mb="xs">
            <Badge variant="light" color="blue" size="lg" leftSection={<IconFileText size={12} />}>
              Document
            </Badge>
            <DocumentTypeBadgeDropdown
              type={editedType}
              onChange={setEditedType}
            />
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
            color="blue"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={updateDocument.isPending}
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
          {/* Description */}
          <Paper className={classes.contentCard} mb="md">
            <Text className={classes.cardLabel}>Description</Text>
            <MarkdownEditor
              value={editedDescription}
              onChange={setEditedDescription}
              placeholder="Add document description..."
              minHeight={80}
              accentColor="document"
              inlineEdit
            />
          </Paper>

          {/* Content */}
          <Paper className={classes.contentCard} mb="md">
            <Text className={classes.cardLabel}>Content</Text>
            <MarkdownEditor
              value={editedContent}
              onChange={setEditedContent}
              placeholder="Add document content..."
              minHeight={250}
              accentColor="document"
              inlineEdit
            />
          </Paper>
        </div>

        {/* Right Column - Sidebar */}
        <div className={classes.sidebar}>
          {/* Tags */}
          <Card title="Tags">
            <TagsEditor
              value={editedTags}
              onChange={setEditedTags}
              variant="document"
              accentColor="document"
            />
          </Card>

          {/* Metadata */}
          <Card title="Metadata">
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>ID</span>
              <span className={classes.metadataValue}>#{document.id}</span>
            </div>
            {document.filename && (
              <div className={classes.metadataRow}>
                <span className={classes.metadataLabel}>Filename</span>
                <span className={classes.metadataValue}>{document.filename}</span>
              </div>
            )}
            {document.size_bytes && (
              <div className={classes.metadataRow}>
                <span className={classes.metadataLabel}>Size</span>
                <span className={classes.metadataValue}>{formatFileSize(document.size_bytes)}</span>
              </div>
            )}
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>Created</span>
              <span className={classes.metadataValue}>
                {new Date(document.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>Updated</span>
              <span className={classes.metadataValue}>
                {new Date(document.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </Card>

          {/* Project */}
          {document.project && (
            <Card title="Project">
              <div
                className={classes.linkedItem}
                onClick={() => navigate(`/projects/${document.project!.id}`)}
              >
                <div className={classes.linkedItemDot} style={{ background: 'var(--accent-project)' }} />
                <div className={classes.linkedItemContent}>
                  <div className={classes.linkedItemTitle}>{document.project.name}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card title="Actions">
            <Stack gap="xs">
              <Button
                variant="light"
                fullWidth
                color="gray"
                onClick={() => {
                  navigator.clipboard.writeText(document.content)
                }}
              >
                Copy Content
              </Button>
            </Stack>
          </Card>
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
