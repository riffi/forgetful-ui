import { useState } from 'react'
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
  IconClock,
} from '@tabler/icons-react'
import { useProjects } from '@/hooks/queries/useProjects'
import { useNavigate, Link } from 'react-router-dom'
import { useDashboardStats, useMemories } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import { useSearch } from '@/context/SearchContext'
import { UnifiedEditorModal } from '@/components/modals'
import { Section, Card } from '@/components/ui'
import type { Memory } from '@/types'
import classes from './Dashboard.module.css'

type EditorType = 'memory' | 'entity' | 'document' | 'code_artifact'

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

interface QuickActionsProps {
  onOpenEditor: (type: EditorType) => void
}

function QuickActions({ onOpenEditor }: QuickActionsProps) {
  const navigate = useNavigate()

  const editorActions: { label: string; type: EditorType; hoverClass: string }[] = [
    { label: 'Memory', type: 'memory', hoverClass: classes.createBtnMemory },
    { label: 'Entity', type: 'entity', hoverClass: classes.createBtnEntity },
    { label: 'Document', type: 'document', hoverClass: classes.createBtnDocument },
    { label: 'Code', type: 'code_artifact', hoverClass: classes.createBtnCode },
  ]

  const navActions = [
    { label: 'Project', path: '/projects?create=true', hoverClass: classes.createBtnProject },
    { label: 'Graph', path: '/graph', hoverClass: classes.createBtnGraph },
  ]

  return (
    <div className={classes.createButtonsGrid}>
      {editorActions.map((action) => (
        <button
          key={action.label}
          className={`${classes.createBtn} ${action.hoverClass}`}
          onClick={() => onOpenEditor(action.type)}
        >
          <IconPlus size={16} />
          {action.label}
        </button>
      ))}
      {navActions.map((action) => (
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
  const { selectedProjectId } = useProjectContext()
  const { openSearch } = useSearch()
  const { stats, isLoading: statsLoading, isError } = useDashboardStats(selectedProjectId)
  const { data: memoriesData, isLoading: memoriesLoading } = useMemories({
    limit: 10,
    project_id: selectedProjectId ?? undefined,
  })
  const { data: projectsData } = useProjects({ limit: 100 })

  // Editor modal state
  const [editorOpened, setEditorOpened] = useState(false)
  const [editorType, setEditorType] = useState<EditorType>('memory')

  const handleOpenEditor = (type: EditorType) => {
    setEditorType(type)
    setEditorOpened(true)
  }

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
        {/* Recent Activities */}
        <Section
          title="Recent Activities"
          icon={<IconClock size={16} />}
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

        {/* Quick Actions Panel */}
        <div className={classes.quickActions}>
          <Card title="Quick Search">
            <div
              className={classes.quickSearchBox}
              onClick={openSearch}
              role="button"
              tabIndex={0}
            >
              <IconSearch size={18} className={classes.quickSearchIcon} />
              <span className={classes.quickSearchPlaceholder}>Search all types...</span>
              <kbd className={classes.quickSearchKbd}>/</kbd>
            </div>
          </Card>

          <Card title="Quick Create">
            <QuickActions onOpenEditor={handleOpenEditor} />
          </Card>

          <Card title="High Importance">
            <HighImportanceMemories memories={memoriesData?.memories ?? []} />
          </Card>
        </div>
      </div>

      <UnifiedEditorModal
        opened={editorOpened}
        onClose={() => setEditorOpened(false)}
        initialType={editorType}
      />
    </div>
  )
}
