import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Text,
  Badge,
  Slider,
  TagsInput,
  Loader,
  Tooltip,
  Select,
} from '@mantine/core'
import {
  IconX,
  IconBrain,
  IconCube,
  IconFile,
  IconCode,
  IconFolder,
  IconExternalLink,
  IconGraph,
  IconTrash,
  IconUnlink,
  IconPlus,
} from '@tabler/icons-react'
import { useQuickEdit, type QuickEditItemType } from '@/context/QuickEditContext'
import {
  useMemory,
  useUpdateMemory,
  useDeleteMemory,
  useMemoryLinks,
} from '@/hooks/queries/useMemories'
import { useEntity, useUpdateEntity, useDeleteEntity } from '@/hooks/queries/useEntities'
import { useDocument, useUpdateDocument, useDeleteDocument } from '@/hooks/queries/useDocuments'
import { useCodeArtifact, useUpdateCodeArtifact, useDeleteCodeArtifact } from '@/hooks/queries/useCodeArtifacts'
import { useProject, useDeleteProject } from '@/hooks/queries/useProjects'
import { useProjects } from '@/hooks/queries/useProjects'
import type { Memory } from '@/types'
import classes from './QuickEditPanel.module.css'

const typeConfig: Record<QuickEditItemType, {
  icon: typeof IconBrain
  color: string
  bgColor: string
  label: string
  route: string
}> = {
  memory: { icon: IconBrain, color: 'var(--accent-memory)', bgColor: 'rgba(168, 85, 247, 0.2)', label: 'Memory', route: '/memories' },
  entity: { icon: IconCube, color: 'var(--accent-entity)', bgColor: 'rgba(245, 158, 11, 0.2)', label: 'Entity', route: '/entities' },
  document: { icon: IconFile, color: 'var(--accent-document)', bgColor: 'rgba(59, 130, 246, 0.2)', label: 'Document', route: '/documents' },
  code_artifact: { icon: IconCode, color: 'var(--accent-code)', bgColor: 'rgba(6, 182, 212, 0.2)', label: 'Code Artifact', route: '/code-artifacts' },
  project: { icon: IconFolder, color: 'var(--accent-project)', bgColor: 'rgba(34, 197, 94, 0.2)', label: 'Project', route: '/projects' },
}

function getImportanceColor(value: number): string {
  if (value >= 9) return 'var(--importance-high)'
  if (value >= 7) return 'var(--importance-medium)'
  return 'var(--importance-low)'
}

// Memory Panel Content
function MemoryContent({ id }: { id: number }) {
  const navigate = useNavigate()
  const { closePanel } = useQuickEdit()
  const { data: memory, isLoading } = useMemory(id)
  const { data: links } = useMemoryLinks(id, 5)
  const updateMemory = useUpdateMemory()
  const deleteMemory = useDeleteMemory()
  const { data: projectsData } = useProjects({ limit: 100 })

  const [localImportance, setLocalImportance] = useState<number>(5)
  const [localTags, setLocalTags] = useState<string[]>([])
  const [newTagValue, setNewTagValue] = useState('')
  const [showProjectSelector, setShowProjectSelector] = useState(false)

  useEffect(() => {
    if (memory) {
      setLocalImportance(memory.importance)
      setLocalTags(memory.tags || [])
    }
  }, [memory])

  if (isLoading) {
    return <div className={classes.loading}><Loader size="sm" /></div>
  }

  if (!memory) {
    return <div className={classes.empty}>Memory not found</div>
  }

  const handleImportanceChange = (value: number) => {
    setLocalImportance(value)
  }

  const handleImportanceSave = () => {
    if (localImportance !== memory.importance) {
      updateMemory.mutate({ id, data: { importance: localImportance } })
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagValue.trim()) {
      const newTag = newTagValue.trim()
      if (!localTags.includes(newTag) && localTags.length < 10) {
        const newTags = [...localTags, newTag]
        setLocalTags(newTags)
        updateMemory.mutate({ id, data: { tags: newTags } })
      }
      setNewTagValue('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = localTags.filter(tag => tag !== tagToRemove)
    setLocalTags(newTags)
    updateMemory.mutate({ id, data: { tags: newTags } })
  }

  const handleDelete = () => {
    if (confirm(`Mark "${memory.title}" as obsolete?`)) {
      deleteMemory.mutate({ id })
      closePanel()
    }
  }

  // Map project_ids to full project objects using projectsData
  const currentProjectIds = memory.project_ids || []
  const currentProjects = projectsData?.projects?.filter(p => currentProjectIds.includes(p.id)) || []
  const availableProjects = projectsData?.projects?.filter(p => !currentProjectIds.includes(p.id)) || []
  const projectOptions = availableProjects.map(p => ({ value: String(p.id), label: p.name }))

  const handleAddProject = (projectId: string | null) => {
    if (projectId) {
      const newProjectIds = [...currentProjectIds, parseInt(projectId, 10)]
      updateMemory.mutate({ id, data: { project_ids: newProjectIds } })
      setShowProjectSelector(false)
    }
  }

  const handleRemoveProject = (projectId: number) => {
    const newProjectIds = currentProjectIds.filter(id => id !== projectId)
    updateMemory.mutate({ id, data: { project_ids: newProjectIds } })
  }

  return (
    <>
      {/* Header */}
      <div className={classes.header}>
        <Badge
          className={classes.typeBadge}
          style={{ backgroundColor: typeConfig.memory.bgColor, color: typeConfig.memory.color }}
        >
          Memory
        </Badge>
        <h2 className={classes.title}>{memory.title}</h2>
      </div>

      {/* Quick Edit Section */}
      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Quick Edit</h3>

        <div className={classes.field}>
          <div className={classes.fieldLabel}>Importance</div>
          <div className={classes.sliderWrapper}>
            <Slider
              value={localImportance}
              onChange={handleImportanceChange}
              onChangeEnd={handleImportanceSave}
              min={1}
              max={10}
              step={1}
              marks={[{ value: 1 }, { value: 5 }, { value: 10 }]}
              color="grape"
              className={classes.slider}
            />
            <Badge
              className={classes.importanceBadge}
              style={{ background: getImportanceColor(localImportance) }}
            >
              {localImportance}
            </Badge>
          </div>
        </div>

        <div className={classes.field}>
          <div className={classes.fieldLabel}>Tags</div>
          {localTags.length > 0 && (
            <div className={classes.tagsRow}>
              {localTags.map((tag) => (
                <span key={tag} className={classes.tagPill}>
                  {tag}
                  <button
                    type="button"
                    className={classes.tagRemove}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <IconX size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            className={classes.tagInput}
            placeholder="Add tag..."
            value={newTagValue}
            onChange={(e) => setNewTagValue(e.target.value)}
            onKeyDown={handleAddTag}
          />
        </div>

        <div className={classes.field}>
          <div className={classes.fieldLabel}>Associated Projects</div>
          <div className={classes.projectsRow}>
            {currentProjects.length > 0 ? (
              currentProjects.map((p) => (
                <span key={p.id} className={classes.projectPill}>
                  {p.name}
                  <button
                    type="button"
                    className={classes.removePillBtn}
                    onClick={() => handleRemoveProject(p.id)}
                  >
                    <IconX size={10} />
                  </button>
                </span>
              ))
            ) : (
              !showProjectSelector && <span className={classes.noProjects}>No projects</span>
            )}
            {showProjectSelector ? (
              <Select
                placeholder="Select project..."
                data={projectOptions}
                onChange={handleAddProject}
                onBlur={() => setShowProjectSelector(false)}
                autoFocus
                size="xs"
                className={classes.projectSelect}
                comboboxProps={{ withinPortal: false }}
              />
            ) : (
              projectOptions.length > 0 && (
                <button
                  type="button"
                  className={classes.addProjectBtn}
                  onClick={() => setShowProjectSelector(true)}
                >
                  <IconPlus size={14} />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Content Preview</h3>
        <p className={classes.contentPreview}>
          {memory.content?.slice(0, 300) || 'No content'}
          {memory.content && memory.content.length > 300 && '...'}
        </p>
        {memory.content && memory.content.length > 300 && (
          <button
            type="button"
            className={classes.showMoreLink}
            onClick={() => navigate(`/memories/${id}`)}
          >
            Show more
          </button>
        )}
      </div>

      {/* Related Items */}
      {links?.linked_memories && links.linked_memories.length > 0 && (
        <div className={classes.section}>
          <h3 className={classes.sectionTitle}>Related Items</h3>
          <div className={classes.relatedList}>
            {links.linked_memories.slice(0, 5).map((link: Memory) => (
              <div key={link.id} className={classes.relatedItem}>
                <span
                  className={classes.relatedDot}
                  style={{ backgroundColor: typeConfig.memory.color }}
                />
                <button
                  className={classes.relatedTitle}
                  onClick={() => navigate(`/memories/${link.id}`)}
                >
                  {link.title}
                </button>
                <Tooltip label="Unlink">
                  <button
                    type="button"
                    className={classes.unlinkBtn}
                  >
                    <IconUnlink size={12} />
                  </button>
                </Tooltip>
              </div>
            ))}
            {links.linked_memories.length > 5 && (
              <button className={classes.showAllLink}>
                Show all {links.linked_memories.length}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={classes.footer}>
        <div className={classes.footerMeta}>
          <Text size="xs" c="dimmed">ID: {memory.id}</Text>
          <Text size="xs" c="dimmed">
            Created: {new Date(memory.created_at).toLocaleDateString()}
          </Text>
        </div>
        <div className={classes.footerActions}>
          <button
            className={classes.btnDanger}
            onClick={handleDelete}
          >
            <IconTrash size={14} />
            Delete
          </button>
          <button
            className={classes.btnGhost}
            onClick={() => navigate(`/graph?focus=memory_${id}`)}
          >
            <IconGraph size={14} />
            View in Graph
          </button>
          <button
            className={classes.btnPrimary}
            onClick={() => navigate(`/memories/${id}`)}
          >
            <IconExternalLink size={14} />
            Edit Full
          </button>
        </div>
      </div>
    </>
  )
}

// Entity Panel Content
function EntityContent({ id }: { id: number }) {
  const navigate = useNavigate()
  const { closePanel } = useQuickEdit()
  const { data: entity, isLoading } = useEntity(id)
  const updateEntity = useUpdateEntity()
  const deleteEntity = useDeleteEntity()

  const [localTags, setLocalTags] = useState<string[]>([])

  useEffect(() => {
    if (entity) {
      setLocalTags(entity.tags || [])
    }
  }, [entity])

  if (isLoading) {
    return <div className={classes.loading}><Loader size="sm" /></div>
  }

  if (!entity) {
    return <div className={classes.empty}>Entity not found</div>
  }

  const handleTagsChange = (tags: string[]) => {
    setLocalTags(tags)
    updateEntity.mutate({ id, data: { tags } })
  }

  const handleDelete = () => {
    if (confirm(`Delete "${entity.name}"?`)) {
      deleteEntity.mutate(id)
      closePanel()
    }
  }

  return (
    <>
      <div className={classes.header}>
        <Badge
          className={classes.typeBadge}
          style={{ backgroundColor: typeConfig.entity.bgColor, color: typeConfig.entity.color }}
        >
          {entity.entity_type}
        </Badge>
        <h2 className={classes.title}>{entity.name}</h2>
      </div>

      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Quick Edit</h3>

        <div className={classes.field}>
          <div className={classes.fieldLabel}>Tags</div>
          <TagsInput
            value={localTags}
            onChange={handleTagsChange}
            placeholder="Add tag..."
            maxTags={10}
            classNames={{ input: classes.tagsInput }}
          />
        </div>
      </div>

      {entity.notes && (
        <div className={classes.section}>
          <h3 className={classes.sectionTitle}>Notes Preview</h3>
          <p className={classes.contentPreview}>
            {entity.notes.slice(0, 300)}
            {entity.notes.length > 300 && '...'}
          </p>
          {entity.notes.length > 300 && (
            <button
              type="button"
              className={classes.showMoreLink}
              onClick={() => navigate(`/entities/${id}`)}
            >
              Show more
            </button>
          )}
        </div>
      )}

      <div className={classes.footer}>
        <div className={classes.footerMeta}>
          <Text size="xs" c="dimmed">ID: {entity.id}</Text>
          <Text size="xs" c="dimmed">
            Created: {new Date(entity.created_at).toLocaleDateString()}
          </Text>
        </div>
        <div className={classes.footerActions}>
          <button className={classes.btnDanger} onClick={handleDelete}>
            <IconTrash size={14} />
            Delete
          </button>
          <button
            className={classes.btnGhost}
            onClick={() => navigate(`/graph?focus=entity_${id}`)}
          >
            <IconGraph size={14} />
            View in Graph
          </button>
          <button
            className={classes.btnPrimary}
            onClick={() => navigate(`/entities/${id}`)}
          >
            <IconExternalLink size={14} />
            Edit Full
          </button>
        </div>
      </div>
    </>
  )
}

// Document Panel Content
function DocumentContent({ id }: { id: number }) {
  const navigate = useNavigate()
  const { closePanel } = useQuickEdit()
  const { data: document, isLoading } = useDocument(id)
  const updateDocument = useUpdateDocument()
  const deleteDocument = useDeleteDocument()

  const [localTags, setLocalTags] = useState<string[]>([])

  useEffect(() => {
    if (document) {
      setLocalTags(document.tags || [])
    }
  }, [document])

  if (isLoading) {
    return <div className={classes.loading}><Loader size="sm" /></div>
  }

  if (!document) {
    return <div className={classes.empty}>Document not found</div>
  }

  const handleTagsChange = (tags: string[]) => {
    setLocalTags(tags)
    updateDocument.mutate({ id, data: { tags } })
  }

  const handleDelete = () => {
    if (confirm(`Delete "${document.title}"?`)) {
      deleteDocument.mutate(id)
      closePanel()
    }
  }

  return (
    <>
      <div className={classes.header}>
        <Badge
          className={classes.typeBadge}
          style={{ backgroundColor: typeConfig.document.bgColor, color: typeConfig.document.color }}
        >
          {document.document_type}
        </Badge>
        <h2 className={classes.title}>{document.title}</h2>
      </div>

      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Quick Edit</h3>

        <div className={classes.field}>
          <div className={classes.fieldLabel}>Tags</div>
          <TagsInput
            value={localTags}
            onChange={handleTagsChange}
            placeholder="Add tag..."
            maxTags={10}
            classNames={{ input: classes.tagsInput }}
          />
        </div>
      </div>

      {document.content && (
        <div className={classes.section}>
          <h3 className={classes.sectionTitle}>Content Preview</h3>
          <div className={classes.contentPreview}>
            {document.content.slice(0, 300)}
            {document.content.length > 300 && (
              <button
                className={classes.showMore}
                onClick={() => navigate(`/documents/${id}`)}
              >
                Show more
              </button>
            )}
          </div>
        </div>
      )}

      <div className={classes.footer}>
        <div className={classes.footerMeta}>
          <Text size="xs" c="dimmed">ID: {document.id}</Text>
          <Text size="xs" c="dimmed">
            {document.size_bytes ? `${Math.round(document.size_bytes / 1024)} KB` : ''}
          </Text>
        </div>
        <div className={classes.footerActions}>
          <button className={classes.btnDanger} onClick={handleDelete}>
            <IconTrash size={14} />
            Delete
          </button>
          <button
            className={classes.btnPrimary}
            onClick={() => navigate(`/documents/${id}`)}
          >
            <IconExternalLink size={14} />
            Edit Full
          </button>
        </div>
      </div>
    </>
  )
}

// Code Artifact Panel Content
function CodeArtifactContent({ id }: { id: number }) {
  const navigate = useNavigate()
  const { closePanel } = useQuickEdit()
  const { data: artifact, isLoading } = useCodeArtifact(id)
  const updateArtifact = useUpdateCodeArtifact()
  const deleteArtifact = useDeleteCodeArtifact()

  const [localTags, setLocalTags] = useState<string[]>([])

  useEffect(() => {
    if (artifact) {
      setLocalTags(artifact.tags || [])
    }
  }, [artifact])

  if (isLoading) {
    return <div className={classes.loading}><Loader size="sm" /></div>
  }

  if (!artifact) {
    return <div className={classes.empty}>Code artifact not found</div>
  }

  const handleTagsChange = (tags: string[]) => {
    setLocalTags(tags)
    updateArtifact.mutate({ id, data: { tags } })
  }

  const handleDelete = () => {
    if (confirm(`Delete "${artifact.title}"?`)) {
      deleteArtifact.mutate(id)
      closePanel()
    }
  }

  return (
    <>
      <div className={classes.header}>
        <Badge
          className={classes.typeBadge}
          style={{ backgroundColor: typeConfig.code_artifact.bgColor, color: typeConfig.code_artifact.color }}
        >
          {artifact.language}
        </Badge>
        <h2 className={classes.title}>{artifact.title}</h2>
      </div>

      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Quick Edit</h3>

        <div className={classes.field}>
          <div className={classes.fieldLabel}>Tags</div>
          <TagsInput
            value={localTags}
            onChange={handleTagsChange}
            placeholder="Add tag..."
            maxTags={10}
            classNames={{ input: classes.tagsInput }}
          />
        </div>
      </div>

      {artifact.code && (
        <div className={classes.section}>
          <h3 className={classes.sectionTitle}>Code Preview</h3>
          <pre className={classes.codePreview}>
            {artifact.code.slice(0, 400)}
            {artifact.code.length > 400 && '...'}
          </pre>
        </div>
      )}

      <div className={classes.footer}>
        <div className={classes.footerMeta}>
          <Text size="xs" c="dimmed">ID: {artifact.id}</Text>
          <Text size="xs" c="dimmed">
            {artifact.code?.split('\n').length || 0} lines
          </Text>
        </div>
        <div className={classes.footerActions}>
          <button className={classes.btnDanger} onClick={handleDelete}>
            <IconTrash size={14} />
            Delete
          </button>
          <button
            className={classes.btnPrimary}
            onClick={() => navigate(`/code-artifacts/${id}`)}
          >
            <IconExternalLink size={14} />
            Edit Full
          </button>
        </div>
      </div>
    </>
  )
}

// Project Panel Content
function ProjectContent({ id }: { id: number }) {
  const navigate = useNavigate()
  const { closePanel } = useQuickEdit()
  const { data: project, isLoading } = useProject(id)
  const deleteProject = useDeleteProject()

  if (isLoading) {
    return <div className={classes.loading}><Loader size="sm" /></div>
  }

  if (!project) {
    return <div className={classes.empty}>Project not found</div>
  }

  const handleDelete = () => {
    if (confirm(`Delete "${project.name}"?`)) {
      deleteProject.mutate(id)
      closePanel()
    }
  }

  return (
    <>
      <div className={classes.header}>
        <Badge
          className={classes.typeBadge}
          style={{ backgroundColor: typeConfig.project.bgColor, color: typeConfig.project.color }}
        >
          {project.project_type}
        </Badge>
        <h2 className={classes.title}>{project.name}</h2>
        <Badge
          size="sm"
          color={project.status === 'active' ? 'green' : project.status === 'completed' ? 'blue' : 'gray'}
        >
          {project.status}
        </Badge>
      </div>

      {project.description && (
        <div className={classes.section}>
          <h3 className={classes.sectionTitle}>Description</h3>
          <div className={classes.contentPreview}>
            {project.description.slice(0, 300)}
            {project.description.length > 300 && (
              <button
                className={classes.showMore}
                onClick={() => navigate(`/projects/${id}`)}
              >
                Show more
              </button>
            )}
          </div>
        </div>
      )}

      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Stats</h3>
        <div className={classes.statsGrid}>
          <div className={classes.statItem}>
            <span className={classes.statValue}>{project.memory_count}</span>
            <span className={classes.statLabel}>Memories</span>
          </div>
        </div>
      </div>

      <div className={classes.footer}>
        <div className={classes.footerMeta}>
          <Text size="xs" c="dimmed">ID: {project.id}</Text>
          <Text size="xs" c="dimmed">
            Created: {new Date(project.created_at).toLocaleDateString()}
          </Text>
        </div>
        <div className={classes.footerActions}>
          <button className={classes.btnDanger} onClick={handleDelete}>
            <IconTrash size={14} />
            Delete
          </button>
          <button
            className={classes.btnPrimary}
            onClick={() => navigate(`/projects/${id}`)}
          >
            <IconExternalLink size={14} />
            Edit Full
          </button>
        </div>
      </div>
    </>
  )
}

// Main Panel Component
export function QuickEditPanel() {
  const { selectedItem, isOpen, closePanel } = useQuickEdit()

  const renderContent = () => {
    if (!selectedItem) return null

    switch (selectedItem.type) {
      case 'memory':
        return <MemoryContent id={selectedItem.id} />
      case 'entity':
        return <EntityContent id={selectedItem.id} />
      case 'document':
        return <DocumentContent id={selectedItem.id} />
      case 'code_artifact':
        return <CodeArtifactContent id={selectedItem.id} />
      case 'project':
        return <ProjectContent id={selectedItem.id} />
      default:
        return null
    }
  }

  return (
    <div className={`${classes.panel} ${isOpen ? classes.open : ''}`}>
      <button
        type="button"
        className={classes.closeBtn}
        onClick={closePanel}
        aria-label="Close panel"
      >
        <IconX size={18} />
      </button>
      <div className={classes.content}>
        {renderContent()}
      </div>
    </div>
  )
}
