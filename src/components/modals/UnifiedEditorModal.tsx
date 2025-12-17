import { useState, useCallback } from 'react'
import {
  Modal,
  Tabs,
  TextInput,
  Textarea,
  Select,
  Slider,
  TagsInput,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Checkbox,
} from '@mantine/core'
import {
  IconBrain,
  IconCube,
  IconFile,
  IconCode,
  IconDeviceFloppy,
  IconX,
  IconPlus,
} from '@tabler/icons-react'
import { useCreateMemory, useCreateEntity, useCreateDocument, useCreateCodeArtifact } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import type { MemoryCreate, EntityCreate, DocumentCreate, CodeArtifactCreate, EntityType } from '@/types'
import classes from './UnifiedEditorModal.module.css'

type EditorType = 'memory' | 'entity' | 'document' | 'code_artifact'

interface UnifiedEditorModalProps {
  opened: boolean
  onClose: () => void
  initialType?: EditorType
  onSuccess?: () => void
}

const ENTITY_TYPE_OPTIONS = [
  { value: 'Organization', label: 'Organization' },
  { value: 'Individual', label: 'Individual' },
  { value: 'Team', label: 'Team' },
  { value: 'Device', label: 'Device' },
  { value: 'Other', label: 'Other' },
]

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'article', label: 'Article' },
  { value: 'note', label: 'Note' },
  { value: 'guide', label: 'Guide' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'reference', label: 'Reference' },
  { value: 'specification', label: 'Specification' },
  { value: 'other', label: 'Other' },
]

const LANGUAGE_OPTIONS = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'other', label: 'Other' },
]

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

export function UnifiedEditorModal({ opened, onClose, initialType = 'memory', onSuccess }: UnifiedEditorModalProps) {
  const { selectedProjectId } = useProjectContext()
  const createMemory = useCreateMemory()
  const createEntity = useCreateEntity()
  const createDocument = useCreateDocument()
  const createCodeArtifact = useCreateCodeArtifact()

  const [activeTab, setActiveTab] = useState<string>(initialType)
  const [saveAndCreateAnother, setSaveAndCreateAnother] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Memory form state
  const [memoryTitle, setMemoryTitle] = useState('')
  const [memoryContent, setMemoryContent] = useState('')
  const [memoryContext, setMemoryContext] = useState('')
  const [memoryKeywords, setMemoryKeywords] = useState<string[]>([])
  const [memoryTags, setMemoryTags] = useState<string[]>([])
  const [memoryImportance, setMemoryImportance] = useState(7)

  // Entity form state
  const [entityName, setEntityName] = useState('')
  const [entityType, setEntityType] = useState<string | null>('Individual')
  const [entityCustomType, setEntityCustomType] = useState('')
  const [entityNotes, setEntityNotes] = useState('')
  const [entityTags, setEntityTags] = useState<string[]>([])

  // Document form state
  const [docTitle, setDocTitle] = useState('')
  const [docDescription, setDocDescription] = useState('')
  const [docContent, setDocContent] = useState('')
  const [docType, setDocType] = useState<string | null>('markdown')
  const [docTags, setDocTags] = useState<string[]>([])

  // Code artifact form state
  const [codeTitle, setCodeTitle] = useState('')
  const [codeDescription, setCodeDescription] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [codeLanguage, setCodeLanguage] = useState<string | null>('typescript')
  const [codeTags, setCodeTags] = useState<string[]>([])

  const resetAllForms = useCallback(() => {
    setMemoryTitle('')
    setMemoryContent('')
    setMemoryContext('')
    setMemoryKeywords([])
    setMemoryTags([])
    setMemoryImportance(7)
    setEntityName('')
    setEntityType('Individual')
    setEntityCustomType('')
    setEntityNotes('')
    setEntityTags([])
    setDocTitle('')
    setDocDescription('')
    setDocContent('')
    setDocType('markdown')
    setDocTags([])
    setCodeTitle('')
    setCodeDescription('')
    setCodeContent('')
    setCodeLanguage('typescript')
    setCodeTags([])
    setErrors({})
  }, [])

  const handleClose = () => {
    resetAllForms()
    onClose()
  }

  const validateMemory = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!memoryTitle.trim()) newErrors.memoryTitle = 'Title is required'
    if (!memoryContent.trim()) newErrors.memoryContent = 'Content is required'
    if (!memoryContext.trim()) newErrors.memoryContext = 'Context is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateEntity = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!entityName.trim()) newErrors.entityName = 'Name is required'
    if (!entityType) newErrors.entityType = 'Type is required'
    if (entityType === 'Other' && !entityCustomType.trim()) {
      newErrors.entityCustomType = 'Custom type is required when Type is "Other"'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateDocument = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!docTitle.trim()) newErrors.docTitle = 'Title is required'
    if (!docContent.trim()) newErrors.docContent = 'Content is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateCodeArtifact = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!codeTitle.trim()) newErrors.codeTitle = 'Title is required'
    if (!codeContent.trim()) newErrors.codeContent = 'Code is required'
    if (!codeLanguage) newErrors.codeLanguage = 'Language is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitMemory = async () => {
    if (!validateMemory()) return

    const data: MemoryCreate = {
      title: memoryTitle.trim(),
      content: memoryContent.trim(),
      context: memoryContext.trim(),
      keywords: memoryKeywords.length > 0 ? memoryKeywords : undefined,
      tags: memoryTags.length > 0 ? memoryTags : undefined,
      importance: memoryImportance,
      project_id: selectedProjectId ?? undefined,
    }

    await createMemory.mutateAsync(data)
    onSuccess?.()

    if (saveAndCreateAnother) {
      setMemoryTitle('')
      setMemoryContent('')
      setMemoryContext('')
      setMemoryKeywords([])
      setMemoryTags([])
      setMemoryImportance(7)
    } else {
      handleClose()
    }
  }

  const handleSubmitEntity = async () => {
    if (!validateEntity()) return

    const data: EntityCreate = {
      name: entityName.trim(),
      entity_type: entityType as EntityType,
      custom_type: entityType === 'Other' ? entityCustomType.trim() : undefined,
      notes: entityNotes.trim() || undefined,
      tags: entityTags.length > 0 ? entityTags : undefined,
    }

    await createEntity.mutateAsync(data)
    onSuccess?.()

    if (saveAndCreateAnother) {
      setEntityName('')
      setEntityCustomType('')
      setEntityNotes('')
      setEntityTags([])
    } else {
      handleClose()
    }
  }

  const handleSubmitDocument = async () => {
    if (!validateDocument()) return

    const data: DocumentCreate = {
      title: docTitle.trim(),
      description: docDescription.trim() || docTitle.trim(),
      content: docContent.trim(),
      document_type: docType || 'markdown',
      tags: docTags.length > 0 ? docTags : undefined,
      project_id: selectedProjectId ?? undefined,
    }

    await createDocument.mutateAsync(data)
    onSuccess?.()

    if (saveAndCreateAnother) {
      setDocTitle('')
      setDocDescription('')
      setDocContent('')
      setDocTags([])
    } else {
      handleClose()
    }
  }

  const handleSubmitCodeArtifact = async () => {
    if (!validateCodeArtifact()) return

    const data: CodeArtifactCreate = {
      title: codeTitle.trim(),
      description: codeDescription.trim(),
      code: codeContent.trim(),
      language: codeLanguage || 'typescript',
      tags: codeTags.length > 0 ? codeTags : undefined,
      project_id: selectedProjectId ?? undefined,
    }

    await createCodeArtifact.mutateAsync(data)
    onSuccess?.()

    if (saveAndCreateAnother) {
      setCodeTitle('')
      setCodeDescription('')
      setCodeContent('')
      setCodeTags([])
    } else {
      handleClose()
    }
  }

  const handleSubmit = () => {
    switch (activeTab) {
      case 'memory':
        handleSubmitMemory()
        break
      case 'entity':
        handleSubmitEntity()
        break
      case 'document':
        handleSubmitDocument()
        break
      case 'code_artifact':
        handleSubmitCodeArtifact()
        break
    }
  }

  const isLoading = createMemory.isPending || createEntity.isPending || createDocument.isPending || createCodeArtifact.isPending

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'memory': return <IconBrain size={16} />
      case 'entity': return <IconCube size={16} />
      case 'document': return <IconFile size={16} />
      case 'code_artifact': return <IconCode size={16} />
      default: return null
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconPlus size={20} />
          <Text fw={600} size="lg">Create New Item</Text>
        </Group>
      }
      size="xl"
      centered
      classNames={{
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'memory')} classNames={{ root: classes.tabs }}>
        <Tabs.List className={classes.tabsList}>
          <Tabs.Tab value="memory" leftSection={getTabIcon('memory')} className={classes.tab}>
            Memory
          </Tabs.Tab>
          <Tabs.Tab value="entity" leftSection={getTabIcon('entity')} className={classes.tab}>
            Entity
          </Tabs.Tab>
          <Tabs.Tab value="document" leftSection={getTabIcon('document')} className={classes.tab}>
            Document
          </Tabs.Tab>
          <Tabs.Tab value="code_artifact" leftSection={getTabIcon('code_artifact')} className={classes.tab}>
            Code
          </Tabs.Tab>
        </Tabs.List>

        {/* Memory Form */}
        <Tabs.Panel value="memory" pt="md">
          <Stack gap="md">
            <TextInput
              label="Title"
              placeholder="Concise, scannable title"
              required
              value={memoryTitle}
              onChange={(e) => setMemoryTitle(e.target.value)}
              error={errors.memoryTitle}
            />
            <Textarea
              label="Content"
              placeholder="ONE concept, self-contained"
              required
              minRows={3}
              value={memoryContent}
              onChange={(e) => setMemoryContent(e.target.value)}
              error={errors.memoryContent}
            />
            <Textarea
              label="Context"
              placeholder="WHY this matters, HOW it relates"
              required
              minRows={2}
              value={memoryContext}
              onChange={(e) => setMemoryContext(e.target.value)}
              error={errors.memoryContext}
            />
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Importance</Text>
                <Badge color={getImportanceColor(memoryImportance)} variant="light">
                  {memoryImportance} - {getImportanceLabel(memoryImportance)}
                </Badge>
              </Group>
              <Slider
                value={memoryImportance}
                onChange={setMemoryImportance}
                min={1}
                max={10}
                marks={[{ value: 1 }, { value: 5 }, { value: 10 }]}
                color={getImportanceColor(memoryImportance)}
              />
            </div>
            <TagsInput
              label="Keywords"
              placeholder="Search terms"
              value={memoryKeywords}
              onChange={setMemoryKeywords}
              maxTags={10}
            />
            <TagsInput
              label="Tags"
              placeholder="Categories"
              value={memoryTags}
              onChange={setMemoryTags}
              maxTags={10}
            />
          </Stack>
        </Tabs.Panel>

        {/* Entity Form */}
        <Tabs.Panel value="entity" pt="md">
          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Entity name"
              required
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              error={errors.entityName}
            />
            <Select
              label="Type"
              placeholder="Select type"
              required
              data={ENTITY_TYPE_OPTIONS}
              value={entityType}
              onChange={setEntityType}
              error={errors.entityType}
            />
            {entityType === 'Other' && (
              <TextInput
                label="Custom Type"
                placeholder="Specify the entity type"
                required
                value={entityCustomType}
                onChange={(e) => setEntityCustomType(e.target.value)}
                error={errors.entityCustomType}
              />
            )}
            <Textarea
              label="Notes"
              placeholder="Additional notes about this entity"
              minRows={3}
              value={entityNotes}
              onChange={(e) => setEntityNotes(e.target.value)}
            />
            <TagsInput
              label="Tags"
              placeholder="Categories"
              value={entityTags}
              onChange={setEntityTags}
              maxTags={10}
            />
          </Stack>
        </Tabs.Panel>

        {/* Document Form */}
        <Tabs.Panel value="document" pt="md">
          <Stack gap="md">
            <TextInput
              label="Title"
              placeholder="Document title"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              error={errors.docTitle}
            />
            <TextInput
              label="Description"
              placeholder="Brief description of the document"
              value={docDescription}
              onChange={(e) => setDocDescription(e.target.value)}
            />
            <Select
              label="Type"
              placeholder="Select type"
              data={DOCUMENT_TYPE_OPTIONS}
              value={docType}
              onChange={setDocType}
            />
            <Textarea
              label="Content"
              placeholder="Document content (Markdown supported)"
              required
              minRows={6}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              error={errors.docContent}
            />
            <TagsInput
              label="Tags"
              placeholder="Categories"
              value={docTags}
              onChange={setDocTags}
              maxTags={10}
            />
          </Stack>
        </Tabs.Panel>

        {/* Code Artifact Form */}
        <Tabs.Panel value="code_artifact" pt="md">
          <Stack gap="md">
            <TextInput
              label="Title"
              placeholder="Code artifact title"
              required
              value={codeTitle}
              onChange={(e) => setCodeTitle(e.target.value)}
              error={errors.codeTitle}
            />
            <Select
              label="Language"
              placeholder="Select language"
              required
              data={LANGUAGE_OPTIONS}
              value={codeLanguage}
              onChange={setCodeLanguage}
              error={errors.codeLanguage}
              searchable
            />
            <Textarea
              label="Description"
              placeholder="What does this code do?"
              minRows={2}
              value={codeDescription}
              onChange={(e) => setCodeDescription(e.target.value)}
            />
            <div>
              <Text size="sm" fw={500} mb="xs">Code</Text>
              <Textarea
                placeholder="Paste your code here..."
                required
                minRows={8}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                error={errors.codeContent}
                classNames={{ input: classes.codeInput }}
              />
            </div>
            <TagsInput
              label="Tags"
              placeholder="Categories"
              value={codeTags}
              onChange={setCodeTags}
              maxTags={10}
            />
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Actions */}
      <Group justify="space-between" mt="xl" className={classes.actions}>
        <Checkbox
          label="Save & Create Another"
          checked={saveAndCreateAnother}
          onChange={(e) => setSaveAndCreateAnother(e.currentTarget.checked)}
          size="sm"
        />
        <Group gap="xs">
          <Button variant="subtle" color="gray" leftSection={<IconX size={16} />} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSubmit}
            loading={isLoading}
            className={classes.submitBtn}
          >
            Create {activeTab === 'code_artifact' ? 'Code' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
