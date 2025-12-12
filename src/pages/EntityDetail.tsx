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
  Select,
  Breadcrumbs,
  Anchor,
  Skeleton,
  TagsInput,
  Tooltip,
  Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconUsers,
  IconPencil,
  IconTrash,
  IconShare3,
  IconDeviceFloppy,
  IconX,
  IconLink,
  IconArrowLeft,
  IconCalendar,
  IconHash,
  IconBuilding,
  IconUser,
  IconDeviceDesktop,
  IconDevices,
  IconArrowRight,
} from '@tabler/icons-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useEntity, useUpdateEntity, useDeleteEntity, useEntityRelationships, useCreateEntityRelationship, useEntities } from '@/hooks'
import type { EntityType, EntityRelationship } from '@/types'
import classes from './EntityDetail.module.css'

const ENTITY_TYPE_OPTIONS = [
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
      <Paper className={classes.relationshipItem}>
        <Group gap="xs" wrap="nowrap">
          <Skeleton height={14} width={14} circle />
          <Skeleton height={14} style={{ flex: 1 }} />
        </Group>
      </Paper>
    )
  }

  return (
    <Paper
      className={classes.relationshipItem}
      onClick={() => navigate(`/entities/${otherEntity.id}`)}
    >
      <Group gap="xs" wrap="nowrap">
        <EntityTypeIcon type={otherEntity.entity_type} size={14} />
        <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
          {otherEntity.name}
        </Text>
        <Badge size="xs" variant="light" color="gray">
          {relationship.relationship_type}
        </Badge>
        {isOutgoing ? (
          <IconArrowRight size={14} color="var(--text-dimmed)" />
        ) : (
          <IconArrowLeft size={14} color="var(--text-dimmed)" />
        )}
      </Group>
    </Paper>
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

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
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

  // Start editing
  const startEditing = () => {
    if (!entity) return
    setEditedName(entity.name)
    setEditedType(entity.entity_type)
    setEditedCustomType(entity.custom_type ?? '')
    setEditedNotes(entity.notes ?? '')
    setEditedTags(entity.tags ?? [])
    setIsEditing(true)
  }

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
    setIsEditing(false)
  }

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false)
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

  // Get entities for select (exclude current entity)
  const entitySelectOptions = (entitiesData?.entities ?? [])
    .filter(e => e.id !== entityId)
    .map(e => ({
      value: String(e.id),
      label: `${e.name} (${e.entity_type})`,
    }))

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
            <IconUsers size={48} color="var(--text-dimmed)" />
            <Title order={3}>Entity not found</Title>
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

  const breadcrumbs = [
    { title: 'Entities', href: '/entities' },
    { title: entity.name, href: `/entities/${entity.id}` },
  ].map((item, index) => (
    <Anchor key={index} component={Link} to={item.href} size="sm">
      {item.title}
    </Anchor>
  ))

  const allRelationships = [
    ...(relationshipsData?.relationships ?? []),
  ]

  return (
    <div className={classes.container}>
      <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>

      {/* Header */}
      <Paper className={classes.header} mb="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <EntityTypeIcon type={entity.entity_type} size={32} />
            {isEditing ? (
              <TextInput
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                size="lg"
                style={{ flex: 1 }}
                placeholder="Entity name..."
              />
            ) : (
              <Title order={2} lineClamp={1} style={{ flex: 1 }}>
                {entity.name}
              </Title>
            )}
          </Group>
          <Group gap="xs">
            <Badge color="orange" variant="light" size="lg">
              {entity.entity_type}
            </Badge>
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
                  color="orange"
                  leftSection={<IconDeviceFloppy size={16} />}
                  onClick={handleSave}
                  loading={updateEntity.isPending}
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
          {/* Entity Type */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Entity Type</Text>
            {isEditing ? (
              <Stack gap="xs">
                <Select
                  value={editedType}
                  onChange={(val) => setEditedType(val as EntityType)}
                  data={ENTITY_TYPE_OPTIONS}
                />
                {editedType === 'Other' && (
                  <TextInput
                    value={editedCustomType}
                    onChange={(e) => setEditedCustomType(e.target.value)}
                    placeholder="Custom type name..."
                    label="Custom Type"
                  />
                )}
              </Stack>
            ) : (
              <Group gap="xs">
                <Badge color="orange" variant="light" size="lg">
                  {entity.entity_type}
                </Badge>
                {entity.custom_type && (
                  <Badge variant="outline" color="gray">
                    {entity.custom_type}
                  </Badge>
                )}
              </Group>
            )}
          </Paper>

          {/* Notes */}
          <Paper className={classes.section} mb="md">
            <Text className={classes.sectionLabel}>Notes</Text>
            {isEditing ? (
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                minRows={4}
                autosize
                placeholder="Notes about this entity..."
              />
            ) : (
              <Text className={classes.contentText}>
                {entity.notes || <span style={{ color: 'var(--text-dimmed)' }}>No notes</span>}
              </Text>
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
                {entity.tags?.length ? (
                  entity.tags.map((tag) => (
                    <Badge key={tag} variant="dot" color="orange">
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
                  ID: {entity.id}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Created: {new Date(entity.created_at).toLocaleString()}
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="var(--text-dimmed)" />
                <Text size="sm" c="dimmed">
                  Updated: {new Date(entity.updated_at).toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </Paper>

          {/* Relationships */}
          <Paper className={classes.section} mb="md">
            <Group justify="space-between" mb="sm">
              <Text className={classes.sectionLabel}>Relationships</Text>
              <Tooltip label="View in Graph">
                <ActionIcon
                  variant="subtle"
                  onClick={() => navigate(`/graph?entity=${entity.id}`)}
                >
                  <IconShare3 size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            {allRelationships.length ? (
              <Stack gap="xs">
                {allRelationships.slice(0, 5).map((rel) => (
                  <RelationshipCard
                    key={rel.id}
                    relationship={rel}
                    currentEntityId={entity.id}
                  />
                ))}
                {allRelationships.length > 5 && (
                  <Text size="sm" c="dimmed" ta="center">
                    +{allRelationships.length - 5} more
                  </Text>
                )}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No relationships
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
          </Paper>
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
