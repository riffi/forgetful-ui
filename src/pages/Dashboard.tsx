import {
  SimpleGrid,
  Paper,
  Text,
  Stack,
  Title,
  ThemeIcon,
  Skeleton,
  Badge,
  Button,
  Anchor,
  Group,
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
  IconSearch,
} from '@tabler/icons-react'
import { useNavigate, Link } from 'react-router-dom'
import { useDashboardStats, useMemories } from '@/hooks'
import type { Memory } from '@/types'
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

function ImportanceBadge({ importance }: { importance: number }) {
  let color = 'gray'
  if (importance >= 9) color = 'red'
  else if (importance >= 7) color = 'yellow'

  return (
    <Badge size="sm" variant="light" color={color}>
      {importance}
    </Badge>
  )
}

interface RecentMemoriesProps {
  memories: Memory[]
  isLoading: boolean
}

function RecentMemories({ memories, isLoading }: RecentMemoriesProps) {
  const navigate = useNavigate()

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
    <div className={classes.memoryList}>
      {memories.map((memory) => (
        <div
          key={memory.id}
          className={classes.memoryRow}
          onClick={() => navigate(`/memories/${memory.id}`)}
        >
          <span className={classes.memoryTitle}>{memory.title}</span>
          <ImportanceBadge importance={memory.importance} />
          <div className={classes.tagList}>
            {memory.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className={classes.tag}>{tag}</span>
            ))}
          </div>
          <span className={classes.memoryDate}>
            {new Date(memory.updated_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  )
}

function QuickActions() {
  const navigate = useNavigate()

  const actions = [
    { label: 'Memory', path: '/memories?create=true', hoverClass: classes.createBtnMemory },
    { label: 'Entity', path: '/entities?create=true', hoverClass: classes.createBtnEntity },
    { label: 'Project', path: '/projects?create=true', hoverClass: classes.createBtnProject },
    { label: 'Document', path: '/documents?create=true', hoverClass: classes.createBtnDocument },
    { label: 'Code', path: '/code-artifacts?create=true', hoverClass: classes.createBtnCode },
    { label: 'Graph', path: '/graph', hoverClass: classes.createBtnGraph },
  ]

  return (
    <div className={classes.createButtonsGrid}>
      {actions.map((action) => (
        <button
          key={action.label}
          className={`${classes.createBtn} ${action.hoverClass}`}
          onClick={() => navigate(action.path)}
        >
          <IconPlus size={16} />
          {action.label}
        </button>
      ))}
    </div>
  )
}

function HighImportanceMemories({ memories }: { memories: Memory[] }) {
  const navigate = useNavigate()
  const highImportance = memories.filter((m) => m.importance >= 9)

  if (highImportance.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No high importance memories (9-10)
      </Text>
    )
  }

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <IconAlertTriangle size={16} color="var(--mantine-color-red-5)" />
        <Badge color="red" variant="light">
          {highImportance.length} critical
        </Badge>
      </Group>
      {highImportance.slice(0, 5).map((memory) => (
        <div
          key={memory.id}
          className={classes.highImportanceItem}
          onClick={() => navigate(`/memories/${memory.id}`)}
        >
          <span className={classes.highImportanceDot} />
          <span className={classes.highImportanceTitle}>{memory.title}</span>
        </div>
      ))}
    </Stack>
  )
}

export function Dashboard() {
  const { stats, isLoading: statsLoading, isError } = useDashboardStats()
  const { data: memoriesData, isLoading: memoriesLoading } = useMemories({ limit: 10 })

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
        <Paper className={classes.section}>
          <div className={classes.sectionHeader}>
            <h2 className={classes.sectionTitle}>Recent Memories</h2>
            <Anchor component={Link} to="/memories" className={classes.viewAllLink}>
              View All →
            </Anchor>
          </div>
          <RecentMemories
            memories={memoriesData?.memories ?? []}
            isLoading={memoriesLoading}
          />
        </Paper>

        {/* Quick Actions Panel */}
        <div className={classes.quickActions}>
          <Paper className={classes.actionCard}>
            <h3 className={classes.actionCardTitle}>Quick Search</h3>
            <div className={classes.quickSearchBox}>
              <IconSearch size={18} className={classes.quickSearchIcon} />
              <input
                type="text"
                className={classes.quickSearchInput}
                placeholder="Search all types..."
              />
            </div>
          </Paper>

          <Paper className={classes.actionCard}>
            <h3 className={classes.actionCardTitle}>Quick Create</h3>
            <QuickActions />
          </Paper>

          <Paper className={classes.actionCard}>
            <h3 className={classes.actionCardTitle}>High Importance</h3>
            <HighImportanceMemories memories={memoriesData?.memories ?? []} />
          </Paper>
        </div>
      </div>
    </div>
  )
}
