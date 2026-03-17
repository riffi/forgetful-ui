import { useState, useMemo } from 'react'
import {
  Title,
  Group,
  Select,
  Text,
  Stack,
  ThemeIcon,
  Skeleton,
  Badge,
  Tooltip,
  Paper,
  Pagination,
  Loader,
} from '@mantine/core'
import {
  IconActivity,
  IconBrain,
  IconBox,
  IconFolder,
  IconFileText,
  IconCode,
  IconPlus,
  IconPencil,
  IconTrash,
  IconEye,
  IconClock,
  IconUser,
  IconRobot,
  IconSettings,
  IconLink,
  IconWifi,
  IconWifiOff,
  IconRefresh,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useActivity, useActivityStream } from '@/hooks'
import type { SSEStatus } from '@/hooks/useActivityStream'
import { Section } from '@/components/ui'
import type { ActivityEvent, ActivityEntityType, ActionType, ActorType } from '@/types'
import classes from './Activity.module.css'

const ITEMS_PER_PAGE = 30

// Entity type options for filter
const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'memory', label: 'Memory' },
  { value: 'entity', label: 'Entity' },
  { value: 'project', label: 'Project' },
  { value: 'document', label: 'Document' },
  { value: 'code_artifact', label: 'Code Artifact' },
  { value: 'link', label: 'Link' },
  { value: 'entity_memory_link', label: 'Entity-Memory Link' },
  { value: 'entity_relationship', label: 'Entity Relationship' },
  { value: 'entity_project_link', label: 'Entity-Project Link' },
]

// Action options for filter
const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'read', label: 'Read' },
  { value: 'queried', label: 'Queried' },
]

// Actor options for filter
const ACTOR_OPTIONS = [
  { value: '', label: 'All Actors' },
  { value: 'user', label: 'User' },
  { value: 'system', label: 'System' },
  { value: 'llm-maintenance', label: 'LLM Maintenance' },
]

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAbsoluteTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActionIcon(action: ActionType) {
  switch (action) {
    case 'created':
      return <IconPlus size={14} />
    case 'updated':
      return <IconPencil size={14} />
    case 'deleted':
      return <IconTrash size={14} />
    case 'read':
    case 'queried':
      return <IconEye size={14} />
    default:
      return <IconClock size={14} />
  }
}

function getActionBadgeColor(action: ActionType): string {
  switch (action) {
    case 'created':
      return 'green'
    case 'updated':
      return 'blue'
    case 'deleted':
      return 'red'
    case 'read':
    case 'queried':
      return 'gray'
    default:
      return 'gray'
  }
}

function getEntityTypeIcon(entityType: ActivityEntityType) {
  switch (entityType) {
    case 'memory':
      return <IconBrain size={16} />
    case 'entity':
      return <IconBox size={16} />
    case 'project':
      return <IconFolder size={16} />
    case 'document':
      return <IconFileText size={16} />
    case 'code_artifact':
      return <IconCode size={16} />
    case 'link':
    case 'entity_memory_link':
    case 'entity_relationship':
    case 'entity_project_link':
      return <IconLink size={16} />
    default:
      return <IconClock size={16} />
  }
}

function getEntityTypeColor(entityType: ActivityEntityType): string {
  switch (entityType) {
    case 'memory':
      return 'var(--accent-memory)'
    case 'entity':
      return 'var(--accent-entity)'
    case 'project':
      return 'var(--accent-project)'
    case 'document':
      return 'var(--accent-document)'
    case 'code_artifact':
      return 'var(--accent-code)'
    default:
      return 'var(--text-dimmed)'
  }
}

function getActorIcon(actor: ActorType) {
  switch (actor) {
    case 'user':
      return <IconUser size={12} />
    case 'system':
      return <IconSettings size={12} />
    case 'llm-maintenance':
      return <IconRobot size={12} />
    default:
      return <IconUser size={12} />
  }
}

function getEntityPath(entityType: ActivityEntityType, entityId: number): string | null {
  switch (entityType) {
    case 'memory':
      return `/memories/${entityId}`
    case 'entity':
      return `/entities/${entityId}`
    case 'project':
      return `/projects/${entityId}`
    case 'document':
      return `/documents/${entityId}`
    case 'code_artifact':
      return `/code-artifacts/${entityId}`
    default:
      return null
  }
}

function getEntityTitle(event: ActivityEvent): string {
  const snapshot = event.snapshot
  return (snapshot.title as string) || (snapshot.name as string) || `#${event.entity_id}`
}

function getEntityTypeLabel(entityType: ActivityEntityType): string {
  switch (entityType) {
    case 'memory':
      return 'Memory'
    case 'entity':
      return 'Entity'
    case 'project':
      return 'Project'
    case 'document':
      return 'Document'
    case 'code_artifact':
      return 'Code Artifact'
    case 'link':
      return 'Link'
    case 'entity_memory_link':
      return 'Entity-Memory'
    case 'entity_relationship':
      return 'Relationship'
    case 'entity_project_link':
      return 'Entity-Project'
    default:
      return entityType
  }
}

interface ActivityRowProps {
  event: ActivityEvent
  onNavigate: (path: string) => void
  isNew?: boolean
}

function ActivityRow({ event, onNavigate, isNew }: ActivityRowProps) {
  const path = getEntityPath(event.entity_type, event.entity_id)
  const isClickable = path !== null && event.action !== 'deleted'

  return (
    <div
      className={`${classes.eventRow} ${isClickable ? classes.eventRowClickable : ''} ${isNew ? classes.eventRowNew : ''}`}
      onClick={isClickable ? () => onNavigate(path) : undefined}
    >
      {/* Timestamp */}
      <Tooltip label={formatAbsoluteTime(event.created_at)} withArrow position="top">
        <span className={classes.eventTime}>
          {formatRelativeTime(event.created_at)}
        </span>
      </Tooltip>

      {/* Action badge */}
      <Badge
        size="xs"
        color={getActionBadgeColor(event.action)}
        variant="light"
        className={classes.actionBadge}
        leftSection={getActionIcon(event.action)}
      >
        {event.action}
      </Badge>

      {/* Entity type icon */}
      <Tooltip label={getEntityTypeLabel(event.entity_type)} withArrow>
        <span
          className={classes.entityTypeIcon}
          style={{ color: getEntityTypeColor(event.entity_type) }}
        >
          {getEntityTypeIcon(event.entity_type)}
        </span>
      </Tooltip>

      {/* Entity title */}
      <span className={classes.eventTitle}>
        {getEntityTitle(event)}
      </span>

      {/* Actor */}
      <Tooltip label={`Actor: ${event.actor}`} withArrow>
        <span className={classes.actorBadge}>
          {getActorIcon(event.actor)}
        </span>
      </Tooltip>
    </div>
  )
}

interface StatsCardProps {
  events: ActivityEvent[]
}

function StatsCard({ events }: StatsCardProps) {
  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const eventsToday = events.filter(e => new Date(e.created_at) >= today).length
  const eventsThisWeek = events.filter(e => new Date(e.created_at) >= weekAgo).length

  // Count by entity type
  const byType: Record<string, number> = {}
  events.forEach(e => {
    byType[e.entity_type] = (byType[e.entity_type] || 0) + 1
  })

  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className={classes.statsCard}>
      <div className={classes.statsRow}>
        <span className={classes.statsLabel}>Today</span>
        <span className={classes.statsValue}>{eventsToday}</span>
      </div>
      <div className={classes.statsRow}>
        <span className={classes.statsLabel}>This week</span>
        <span className={classes.statsValue}>{eventsThisWeek}</span>
      </div>
      <div className={classes.statsDivider} />
      <div className={classes.statsSection}>
        <span className={classes.statsSectionTitle}>By Type</span>
        {topTypes.map(([type, count]) => (
          <div key={type} className={classes.statsTypeRow}>
            <span
              className={classes.statsTypeDot}
              style={{ background: getEntityTypeColor(type as ActivityEntityType) }}
            />
            <span className={classes.statsTypeLabel}>
              {getEntityTypeLabel(type as ActivityEntityType)}
            </span>
            <span className={classes.statsTypeCount}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SSEStatusBarProps {
  status: SSEStatus
  error: string | null
  onReconnect: () => void
}

function SSEStatusBar({ status, error, onReconnect }: SSEStatusBarProps) {
  const getStatusContent = () => {
    switch (status) {
      case 'connected':
        return (
          <>
            <IconWifi size={14} />
            <span>Live updates active</span>
          </>
        )
      case 'connecting':
        return (
          <>
            <Loader size={14} />
            <span>Connecting...</span>
          </>
        )
      case 'error':
      case 'disconnected':
        return (
          <>
            <IconWifiOff size={14} />
            <span>{error || 'Disconnected'}</span>
            <button className={classes.reconnectBtn} onClick={onReconnect}>
              <IconRefresh size={12} />
              Reconnect
            </button>
          </>
        )
      case 'disabled':
        return (
          <>
            <IconWifiOff size={14} />
            <span>Live updates unavailable</span>
          </>
        )
      default:
        return null
    }
  }

  const statusClass = status === 'connected' ? classes.sseStatusConnected :
                      status === 'connecting' ? classes.sseStatusConnecting :
                      classes.sseStatusDisconnected

  return (
    <div className={`${classes.sseStatusBar} ${statusClass}`}>
      {getStatusContent()}
    </div>
  )
}

export function Activity() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [actorFilter, setActorFilter] = useState<string>('')

  // SSE stream for real-time updates (only on first page without filters)
  const enableSSE = page === 1 && !entityTypeFilter && !actionFilter && !actorFilter
  const {
    events: sseEvents,
    status: sseStatus,
    error: sseError,
    reconnect,
  } = useActivityStream({
    enabled: enableSSE,
  })

  // Regular API fetch for historical data
  const { data, isLoading, isError } = useActivity({
    entity_type: entityTypeFilter as ActivityEntityType || undefined,
    action: actionFilter as ActionType || undefined,
    actor: actorFilter as ActorType || undefined,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  })

  const apiEvents = data?.events ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  // Merge SSE events with API events (SSE events are newer, deduplicate by id)
  const events = useMemo(() => {
    if (!enableSSE || sseEvents.length === 0) {
      return apiEvents
    }

    const apiEventIds = new Set(apiEvents.map(e => e.id))
    const uniqueSseEvents = sseEvents.filter(e => !apiEventIds.has(e.id))
    return [...uniqueSseEvents, ...apiEvents]
  }, [enableSSE, sseEvents, apiEvents])

  // Track which events came from SSE (for highlighting)
  const sseEventIds = useMemo(() => new Set(sseEvents.map(e => e.id)), [sseEvents])

  const handleClearFilters = () => {
    setEntityTypeFilter('')
    setActionFilter('')
    setActorFilter('')
    setPage(1)
  }

  const hasFilters = entityTypeFilter || actionFilter || actorFilter

  // Determine live indicator status
  const isLive = sseStatus === 'connected'

  return (
    <div className={classes.container}>
      {/* Header */}
      <div className={classes.header}>
        <Group gap="md">
          <Title order={1} className={classes.title}>Activity</Title>
          <div className={`${classes.liveIndicator} ${isLive ? '' : classes.liveIndicatorInactive}`}>
            <span className={`${classes.liveDot} ${isLive ? '' : classes.liveDotInactive}`} />
            <span className={classes.liveText}>{isLive ? 'Live' : 'Offline'}</span>
          </div>
        </Group>
      </div>

      {/* Filters */}
      <Paper className={classes.filtersBar}>
        <Group gap="md">
          <Select
            placeholder="All Types"
            data={ENTITY_TYPE_OPTIONS}
            value={entityTypeFilter}
            onChange={(val) => {
              setEntityTypeFilter(val ?? '')
              setPage(1)
            }}
            clearable
            size="sm"
            className={classes.filterSelect}
          />
          <Select
            placeholder="All Actions"
            data={ACTION_OPTIONS}
            value={actionFilter}
            onChange={(val) => {
              setActionFilter(val ?? '')
              setPage(1)
            }}
            clearable
            size="sm"
            className={classes.filterSelect}
          />
          <Select
            placeholder="All Actors"
            data={ACTOR_OPTIONS}
            value={actorFilter}
            onChange={(val) => {
              setActorFilter(val ?? '')
              setPage(1)
            }}
            clearable
            size="sm"
            className={classes.filterSelect}
          />
          {hasFilters && (
            <Text
              size="sm"
              className={classes.clearFilters}
              onClick={handleClearFilters}
            >
              Clear filters
            </Text>
          )}
        </Group>
        <Text size="sm" c="dimmed">
          {total.toLocaleString()} events
        </Text>
      </Paper>

      {/* Main content */}
      <div className={classes.mainGrid}>
        {/* Events list */}
        <Section
          title="Events"
          icon={<IconActivity size={16} />}
          noPadding
        >
          {isLoading ? (
            <div className={classes.eventsList}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className={classes.eventRow}>
                  <Skeleton height={16} width="100%" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <Stack align="center" py="xl" gap="md">
              <ThemeIcon size={48} variant="light" color="red" radius="xl">
                <IconActivity size={24} />
              </ThemeIcon>
              <Text c="dimmed" ta="center">
                Failed to load activity. Check your connection.
              </Text>
            </Stack>
          ) : events.length === 0 ? (
            <Stack align="center" py="xl" gap="md">
              <ThemeIcon size={48} variant="light" color="gray" radius="xl">
                <IconClock size={24} />
              </ThemeIcon>
              <Text c="dimmed" ta="center">
                No activity found
              </Text>
              {hasFilters && (
                <Text
                  size="sm"
                  className={classes.clearFilters}
                  onClick={handleClearFilters}
                >
                  Clear filters
                </Text>
              )}
            </Stack>
          ) : (
            <>
              <div className={classes.eventsList}>
                {events.map((event) => (
                  <ActivityRow
                    key={event.id}
                    event={event}
                    onNavigate={navigate}
                    isNew={sseEventIds.has(event.id)}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className={classes.pagination}>
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={totalPages}
                    size="sm"
                  />
                </div>
              )}
            </>
          )}
        </Section>

        {/* Sidebar */}
        <div className={classes.sidebar}>
          <Section title="Statistics" icon={<IconActivity size={16} />}>
            {isLoading ? (
              <Stack gap="xs">
                <Skeleton height={20} />
                <Skeleton height={20} />
                <Skeleton height={20} />
              </Stack>
            ) : (
              <StatsCard events={events} />
            )}
          </Section>
        </div>
      </div>

      {/* SSE Status Bar */}
      <SSEStatusBar
        status={sseStatus}
        error={sseError}
        onReconnect={reconnect}
      />
    </div>
  )
}
