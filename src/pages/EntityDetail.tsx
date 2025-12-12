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
  TextInput,
  Select,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCube,
  IconTrash,
  IconDeviceFloppy,
  IconArrowLeft,
  IconBuilding,
  IconUser,
  IconUsers,
  IconDeviceDesktop,
  IconDevices,
  IconArrowRight,
  IconChevronDown,
  IconShare3,
  IconLink,
  IconPlus,
} from '@tabler/icons-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEntity, useUpdateEntity, useDeleteEntity, useEntityRelationships, useCreateEntityRelationship, useEntities } from '@/hooks'
import { Breadcrumb, Card, TagsEditor, MarkdownEditor } from '@/components/ui'
import type { EntityType, EntityRelationship } from '@/types'
import classes from './EntityDetail.module.css'

const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'Organization', label: 'Organization' },
  { value: 'Individual', label: 'Individual' },
  { value: 'Team', label: 'Team' },
  { value: 'Device', label: 'Device' },
  { value: 'Other', label: 'Other' },
]

function EntityTypeIcon({ type, size = 16 }: { type: EntityType; size?: number }) {
  const iconProps = { size, color: 'var(--accent-entity)' }

  switch (type) {
    case 'Organization':
      return <IconBuilding {...iconProps} />
    case 'Individual':
      return <IconUser {...iconProps} />
    case 'Team':
      return <IconUsers {...iconProps} />
    case 'Device':
      return <IconDeviceDesktop {...iconProps} />
    default:
      return <IconDevices {...iconProps} />
  }
}

// Entity type badge with dropdown
function EntityTypeBadgeDropdown({ type, onChange }: { type: EntityType; onChange: (type: EntityType) => void }) {
  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Badge
          className={classes.clickableBadge}
          variant="light"
          color="orange"
          size="lg"
          leftSection={<EntityTypeIcon type={type} size={12} />}
          rightSection={<IconChevronDown size={10} />}
        >
          {type}
        </Badge>
      </Menu.Target>
      <Menu.Dropdown>
        {ENTITY_TYPE_OPTIONS.map(opt => (
          <Menu.Item
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={opt.value === type ? classes.menuItemActive : undefined}
            leftSection={<EntityTypeIcon type={opt.value} size={14} />}
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

// Relationship card component
function RelationshipCard({ relationship, currentEntityId }: { relationship: EntityRelationship; currentEntityId: number }) {
  const navigate = useNavigate()
  const isOutgoing = relationship.source_entity_id === currentEntityId
  const otherEntityId = isOutgoing ? relationship.target_entity_id : relationship.source_entity_id
  const populatedEntity = isOutgoing ? relationship.target_entity : relationship.source_entity

  // Fetch entity data if not populated
  const { data: fetchedEntity } = useEntity(populatedEntity ? 0 : otherEntityId)
  const otherEntity = populatedEntity ?? fetchedEntity

  if (!otherEntity) {
    return (
      <div className={classes.linkedItem}>
        <Skeleton height={14} width={14} circle />
        <Skeleton height={14} style={{ flex: 1 }} />
      </div>
    )
  }

  return (
    <div
      className={classes.linkedItem}
      onClick={() => navigate(`/entities/${otherEntity.id}`)}
    >
      <div className={classes.linkedItemDot} style={{ background: 'var(--accent-entity)' }} />
      <div className={classes.linkedItemContent}>
        <div className={classes.linkedItemTitle}>{otherEntity.name}</div>
        <div className={classes.linkedItemMeta}>
          {relationship.relationship_type} • {otherEntity.entity_type}
        </div>
      </div>
      {isOutgoing ? (
        <IconArrowRight size={14} color="var(--text-dimmed)" />
      ) : (
        <IconArrowLeft size={14} color="var(--text-dimmed)" />
      )}
    </div>
  )
}

export function EntityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const entityId = parseInt(id ?? '0')

  const { data: entity, isLoading, isError } = useEntity(entityId)
  const { data: relationshipsData } = useEntityRelationships(entityId)
  const updateEntity = useUpdateEntity()
  const deleteEntity = useDeleteEntity()

  // Local edit state (inline editing - no separate edit mode)
  const [editedName, setEditedName] = useState('')
  const [editedType, setEditedType] = useState<EntityType>('Other')
  const [editedCustomType, setEditedCustomType] = useState('')
  const [editedNotes, setEditedNotes] = useState('')
  const [editedTags, setEditedTags] = useState<string[]>([])

  // Delete modal
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

  // Add Relationship modal
  const [addRelOpened, { open: openAddRel, close: closeAddRel }] = useDisclosure(false)
  const [relTargetId, setRelTargetId] = useState<string | null>(null)
  const [relType, setRelType] = useState('')
  const createRelationship = useCreateEntityRelationship()
  const { data: entitiesData } = useEntities({ limit: 100 })

  // Initialize edit state from entity data
  useEffect(() => {
    if (entity) {
      setEditedName(entity.name)
      setEditedType(entity.entity_type)
      setEditedCustomType(entity.custom_type ?? '')
      setEditedNotes(entity.notes ?? '')
      setEditedTags(entity.tags ?? [])
    }
  }, [entity])

  // Check if there are unsaved changes
  const hasChanges = entity && (
    editedName !== entity.name ||
    editedType !== entity.entity_type ||
    editedCustomType !== (entity.custom_type ?? '') ||
    editedNotes !== (entity.notes ?? '') ||
    JSON.stringify(editedTags) !== JSON.stringify(entity.tags ?? [])
  )

  // Get entities for select (exclude current entity)
  const entitySelectOptions = (entitiesData?.entities ?? [])
    .filter(e => e.id !== entityId)
    .map(e => ({
      value: String(e.id),
      label: `${e.name} (${e.entity_type})`,
    }))

  // Save changes
  const handleSave = async () => {
    await updateEntity.mutateAsync({
      id: entityId,
      data: {
        name: editedName,
        entity_type: editedType,
        custom_type: editedCustomType || undefined,
        notes: editedNotes || undefined,
        tags: editedTags,
      },
    })
  }

  // Handle delete
  const handleDelete = async () => {
    await deleteEntity.mutateAsync(entityId)
    closeDelete()
    navigate('/entities')
  }

  // Handle add relationship
  const handleAddRelationship = async () => {
    if (!relTargetId || !relType.trim()) return

    await createRelationship.mutateAsync({
      entityId,
      data: {
        target_entity_id: parseInt(relTargetId),
        relationship_type: relType.trim(),
      },
    })
    setRelTargetId(null)
    setRelType('')
    closeAddRel()
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

  if (isError || !entity) {
    return (
      <div className={classes.container}>
        <Paper className={classes.errorState}>
          <Stack align="center" gap="md">
            <IconCube size={48} color="var(--text-dimmed)" />
            <Text size="xl" fw={600}>Entity not found</Text>
            <Text c="dimmed">The entity you're looking for doesn't exist.</Text>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/entities')}
            >
              Back to Entities
            </Button>
          </Stack>
        </Paper>
      </div>
    )
  }

  const breadcrumbItems = [
    { title: 'Entities', href: '/entities' },
    { title: entity.name, href: `/entities/${entity.id}` },
  ]

  const allRelationships = [
    ...(relationshipsData?.relationships ?? []),
  ]

  return (
    <div className={classes.container}>
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className={classes.pageHeader}>
        <div className={classes.headerMain}>
          {/* Badges row */}
          <Group gap="xs" mb="xs">
            <Badge variant="light" color="orange" size="lg" leftSection={<IconCube size={12} />}>
              Entity
            </Badge>
            <EntityTypeBadgeDropdown
              type={editedType}
              onChange={setEditedType}
            />
            {editedType === 'Other' && (
              <TextInput
                value={editedCustomType}
                onChange={(e) => setEditedCustomType(e.target.value)}
                placeholder="Custom type..."
                size="xs"
                className={classes.customTypeInline}
              />
            )}
          </Group>

          {/* Title row - inline editable */}
          <EditableTitle value={editedName} onChange={setEditedName} />
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
            color="orange"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={updateEntity.isPending}
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
          {/* Notes - markdown editor (click to edit) */}
          <Paper className={classes.contentCard}>
            <Text className={classes.cardLabel}>Notes</Text>
            <MarkdownEditor
              value={editedNotes}
              onChange={setEditedNotes}
              placeholder="Add notes about this entity..."
              minHeight={250}
              accentColor="entity"
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
              variant="entity"
              accentColor="entity"
            />
          </Card>

          {/* Metadata */}
          <Card title="Metadata">
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>ID</span>
              <span className={classes.metadataValue}>#{entity.id}</span>
            </div>
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>Created</span>
              <span className={classes.metadataValue}>
                {new Date(entity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className={classes.metadataRow}>
              <span className={classes.metadataLabel}>Updated</span>
              <span className={classes.metadataValue}>
                {new Date(entity.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </Card>

          {/* Relationships */}
          <Card title="Relationships">
            {allRelationships.length ? (
              <>
                {allRelationships.slice(0, 5).map((rel) => (
                  <RelationshipCard
                    key={rel.id}
                    relationship={rel}
                    currentEntityId={entity.id}
                  />
                ))}
                {allRelationships.length > 5 && (
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    +{allRelationships.length - 5} more
                  </Text>
                )}
              </>
            ) : (
              <Text size="sm" c="dimmed">No relationships</Text>
            )}
            <button className={classes.addLinkBtn} onClick={openAddRel}>
              <IconPlus size={14} />
              Add relationship
            </button>
          </Card>

          {/* Actions */}
          <Card title="Actions">
            <Stack gap="xs">
              <Button
                variant="light"
                leftSection={<IconShare3 size={16} />}
                fullWidth
                onClick={() => navigate(`/graph?entity=${entity.id}`)}
              >
                View in Graph
              </Button>
              <Button
                variant="light"
                leftSection={<IconLink size={16} />}
                fullWidth
                color="gray"
                onClick={openAddRel}
              >
                Add Relationship
              </Button>
            </Stack>
          </Card>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete Entity"
        centered
      >
        <Stack>
          <Text size="sm">
            Are you sure you want to delete "{entity.name}"? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={closeDelete}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={deleteEntity.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Relationship Modal */}
      <Modal
        opened={addRelOpened}
        onClose={closeAddRel}
        title={
          <Group gap="xs">
            <IconLink size={20} color="var(--accent-entity)" />
            <Text fw={600}>Add Relationship</Text>
          </Group>
        }
        centered
      >
        <Stack>
          <Select
            label="Target Entity"
            placeholder="Select an entity..."
            data={entitySelectOptions}
            value={relTargetId}
            onChange={setRelTargetId}
            searchable
            required
          />
          <TextInput
            label="Relationship Type"
            placeholder="e.g., works_for, manages, collaborates_with"
            value={relType}
            onChange={(e) => setRelType(e.target.value)}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={closeAddRel}>
              Cancel
            </Button>
            <Button
              color="orange"
              leftSection={<IconLink size={16} />}
              onClick={handleAddRelationship}
              loading={createRelationship.isPending}
              disabled={!relTargetId || !relType.trim()}
            >
              Create Relationship
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}
