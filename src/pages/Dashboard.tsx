import {
  SimpleGrid,
  Paper,
  Text,
  Stack,
  Title,
  ThemeIcon,
  Skeleton,
  Button,
  Anchor,
  Group,
  Tooltip,
} from '@mantine/core'
import {
  IconBrain,
  IconBox,
  IconFolder,
  IconFileText,
  IconCode,
  IconShare3,
  IconPlus,
  IconAlertTriangle,
  IconClock,
  IconPencil,
  IconTrash,
  IconEye,
} from '@tabler/icons-react'
import { useProjects } from '@/hooks/queries/useProjects'
import { useNavigate, Link } from 'react-router-dom'
import { useDashboardStats, useMemories, useRecentActivity } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import { Section } from '@/components/ui'
import type { Memory, ActivityEvent, ActivityEntityType, ActionType } from '@/types'
import classes from './Dashboard.module.css'

interface StatCardProps {
  title: string
  count: number
  icon: React.ReactNode
  iconClass: string
  path: string
  isLoading?: boolean
}

function StatCard({ title, count, icon, iconClass, path, isLoading }: StatCardProps) {
  const navigate = useNavigate()

  return (
    <Paper
      className={classes.statCard}
      onClick={() => navigate(path)}
    >
      <div className={iconClass}>
        {icon}
      </div>
      {isLoading ? (
        <Skeleton height={28} width={60} mb={4} />
      ) : (
        <div className={classes.statCount}>{count.toLocaleString()}</div>
      )}
      <div className={classes.statLabel}>{title}</div>
    </Paper>
  )
}

function getImportanceDotClass(importance: number): string {
  if (importance >= 9) return classes.importanceDotHigh
  if (importance >= 7) return classes.importanceDotMedium
  return classes.importanceDotLow
}

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

interface RecentMemoriesProps {
  memories: Memory[]
  isLoading: boolean
  projects: { id: number; name: string }[]
}

function RecentMemories({ memories, isLoading, projects }: RecentMemoriesProps) {
  const navigate = useNavigate()

  // Create project lookup map
  const projectMap = new Map(projects.map(p => [p.id, p.name]))

  const getProjectName = (memory: Memory): string | null => {
    const projectIds = memory.project_ids || []
    if (projectIds.length === 0) return null
    return projectMap.get(projectIds[0]) || null
  }

  if (isLoading) {
    return (
      <div className={classes.memoryList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={classes.memoryRow}>
            <Skeleton height={20} width="60%" />
          </div>
        ))}
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <Stack align="center" py="xl" gap="md">
        <ThemeIcon size={48} variant="light" color="purple" radius="xl">
          <IconBrain size={24} />
        </ThemeIcon>
        <Text c="dimmed" ta="center">
          No memories yet. Create your first memory to get started.
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          color="purple"
          onClick={() => navigate('/memories?create=true')}
        >
          Create Memory
        </Button>
      </Stack>
    )
  }

  return (
    <div className={classes.tableWrapper}>
      <table className={classes.table}>
        <thead>
          <tr className={classes.tableHeader}>
            <th className={classes.thTitle}>Title</th>
            <th className={classes.thContext}>Context</th>
            <th className={classes.thTags}>Tags</th>
            <th className={classes.thUpdated}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {memories.map((memory) => {
            const projectName = getProjectName(memory)
            return (
              <tr
                key={memory.id}
                className={classes.tableRow}
                onClick={() => navigate(`/memories/${memory.id}`)}
              >
                <td className={classes.tdTitle}>
                  <div className={classes.titleCell}>
                    <span className={`${classes.importanceDot} ${getImportanceDotClass(memory.importance)}`} />
                    <span className={classes.memoryTitle}>{memory.title}</span>
                  </div>
                </td>
                <td className={classes.tdContext}>
                  {projectName ? (
                    <span className={classes.projectBadge}>{projectName}</span>
                  ) : (
                    <span className={classes.noProject}>No project</span>
                  )}
                </td>
                <td className={classes.tdTags}>
                  <div className={classes.tagList}>
                    {memory.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className={classes.tag}>#{tag}</span>
                    ))}
                  </div>
                </td>
                <td className={classes.tdUpdated}>
                  {formatRelativeTime(memory.updated_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Action icon and color mapping
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

function getActionColor(action: ActionType): string {
  switch (action) {
    case 'created':
      return 'var(--mantine-color-green-5)'
    case 'updated':
      return 'var(--mantine-color-blue-5)'
    case 'deleted':
      return 'var(--mantine-color-red-5)'
    case 'read':
    case 'queried':
      return 'var(--mantine-color-gray-5)'
    default:
      return 'var(--mantine-color-gray-5)'
  }
}

function getEntityTypeIcon(entityType: ActivityEntityType) {
  switch (entityType) {
    case 'memory':
      return <IconBrain size={14} />
    case 'entity':
      return <IconBox size={14} />
    case 'project':
      return <IconFolder size={14} />
    case 'document':
      return <IconFileText size={14} />
    case 'code_artifact':
      return <IconCode size={14} />
    default:
      return <IconClock size={14} />
  }
}

function getEntityTypeColor(entityType: ActivityEntityType): string {
  switch (entityType) {
    case 'memory':
      return 'var(--mantine-color-violet-5)'
    case 'entity':
      return 'var(--mantine-color-orange-5)'
    case 'project':
      return 'var(--mantine-color-green-5)'
    case 'document':
      return 'var(--mantine-color-blue-5)'
    case 'code_artifact':
      return 'var(--mantine-color-cyan-5)'
    default:
      return 'var(--mantine-color-gray-5)'
  }
}

function getEntityPath(entityType: ActivityEntityType, entityId: number): string {
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
      return '#'
  }
}

function getEntityTitle(event: ActivityEvent): string {
  const snapshot = event.snapshot
  return (snapshot.title as string) || (snapshot.name as string) || `#${event.entity_id}`
}

interface RecentActivityProps {
  events: ActivityEvent[]
  isLoading: boolean
}

function RecentActivity({ events, isLoading }: RecentActivityProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className={classes.activityList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={classes.activityRow}>
            <Skeleton height={16} width="100%" />
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Stack align="center" py="xl" gap="md">
        <ThemeIcon size={48} variant="light" color="gray" radius="xl">
          <IconClock size={24} />
        </ThemeIcon>
        <Text c="dimmed" ta="center" size="sm">
          No recent activity
        </Text>
      </Stack>
    )
  }

  return (
    <div className={classes.activityList}>
      {events.map((event) => (
        <div
          key={event.id}
          className={classes.activityRow}
          onClick={() => navigate(getEntityPath(event.entity_type, event.entity_id))}
        >
          <span className={classes.activityTime}>
            {formatRelativeTime(event.created_at)}
          </span>
          <Tooltip label={event.action} withArrow>
            <span
              className={classes.activityActionIcon}
              style={{ color: getActionColor(event.action) }}
            >
              {getActionIcon(event.action)}
            </span>
          </Tooltip>
          <Tooltip label={event.entity_type} withArrow>
            <span
              className={classes.activityTypeIcon}
              style={{ color: getEntityTypeColor(event.entity_type) }}
            >
              {getEntityTypeIcon(event.entity_type)}
            </span>
          </Tooltip>
          <span className={classes.activityTitle}>
            {getEntityTitle(event)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Dashboard() {
  const { selectedProjectId } = useProjectContext()
  const { stats, isLoading: statsLoading, isError } = useDashboardStats(selectedProjectId)
  const { data: memoriesData, isLoading: memoriesLoading } = useMemories({
    limit: 10,
    project_id: selectedProjectId ?? undefined,
  })
  const { data: projectsData } = useProjects({ limit: 100 })
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(15)

  const statCards = [
    {
      title: 'Memories',
      count: stats?.memories_count ?? 0,
      icon: <IconBrain size={22} />,
      iconClass: classes.statIconMemory,
      path: '/memories',
    },
    {
      title: 'Entities',
      count: stats?.entities_count ?? 0,
      icon: <IconBox size={22} />,
      iconClass: classes.statIconEntity,
      path: '/entities',
    },
    {
      title: 'Projects',
      count: stats?.projects_count ?? 0,
      icon: <IconFolder size={22} />,
      iconClass: classes.statIconProject,
      path: '/projects',
    },
    {
      title: 'Documents',
      count: stats?.documents_count ?? 0,
      icon: <IconFileText size={22} />,
      iconClass: classes.statIconDocument,
      path: '/documents',
    },
    {
      title: 'Code Artifacts',
      count: stats?.code_artifacts_count ?? 0,
      icon: <IconCode size={22} />,
      iconClass: classes.statIconCode,
      path: '/code-artifacts',
    },
    {
      title: 'Relations',
      count: stats?.relations_count ?? 0,
      icon: <IconShare3 size={22} />,
      iconClass: classes.statIconGraph,
      path: '/graph',
    },
  ]

  return (
    <div className={classes.dashboard}>
      <Title order={1} className={classes.title}>
        Dashboard
      </Title>

      {isError && (
        <Paper className={classes.errorBanner} withBorder>
          <Group>
            <IconAlertTriangle color="var(--mantine-color-red-5)" />
            <Text c="red">Failed to load statistics. Please check your connection.</Text>
          </Group>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} isLoading={statsLoading} />
        ))}
      </SimpleGrid>

      <div className={classes.mainGrid}>
        {/* Recent Memories */}
        <Section
          title="Recent Memories"
          icon={<IconBrain size={16} />}
          action={
            <Anchor component={Link} to="/memories" className={classes.viewAllLink}>
              View All
            </Anchor>
          }
          noPadding
        >
          <RecentMemories
            memories={memoriesData?.memories ?? []}
            isLoading={memoriesLoading}
            projects={projectsData?.projects ?? []}
          />
        </Section>

        {/* Recent Activity Panel */}
        <Section
          title="Recent Activity"
          icon={<IconClock size={16} />}
          action={
            activityData && activityData.events.length > 0 ? (
              <Group gap="xs">
                <span className={classes.liveIndicator} />
                <Anchor component={Link} to="/activity" className={classes.viewAllLink}>
                  View All
                </Anchor>
              </Group>
            ) : null
          }
          noPadding
        >
          <RecentActivity
            events={activityData?.events ?? []}
            isLoading={activityLoading}
          />
        </Section>
      </div>
    </div>
  )
}
