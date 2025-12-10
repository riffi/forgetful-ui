import { SimpleGrid, Paper, Text, Group, Stack, Title, ThemeIcon } from '@mantine/core'
import {
  IconBrain,
  IconBox,
  IconFolder,
  IconFileText,
  IconCode,
  IconShare3,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import classes from './Dashboard.module.css'

interface StatCardProps {
  title: string
  count: number
  icon: React.ReactNode
  color: string
  path: string
}

function StatCard({ title, count, icon, color, path }: StatCardProps) {
  const navigate = useNavigate()

  return (
    <Paper
      className={classes.statCard}
      onClick={() => navigate(path)}
      style={{ cursor: 'pointer' }}
    >
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text className={classes.statCount}>{count}</Text>
          <Text className={classes.statLabel}>{title}</Text>
        </Stack>
        <ThemeIcon
          size={44}
          radius="md"
          variant="light"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  )
}

export function Dashboard() {
  // Placeholder data - will be replaced with API calls
  const stats = [
    { title: 'Memories', count: 0, icon: <IconBrain size={24} />, color: 'var(--accent-memory)', path: '/memories' },
    { title: 'Entities', count: 0, icon: <IconBox size={24} />, color: 'var(--accent-entity)', path: '/entities' },
    { title: 'Projects', count: 0, icon: <IconFolder size={24} />, color: 'var(--accent-project)', path: '/projects' },
    { title: 'Documents', count: 0, icon: <IconFileText size={24} />, color: 'var(--accent-document)', path: '/documents' },
    { title: 'Code Artifacts', count: 0, icon: <IconCode size={24} />, color: 'var(--accent-code-artifact)', path: '/code-artifacts' },
    { title: 'Relations', count: 0, icon: <IconShare3 size={24} />, color: '#94a3b8', path: '/graph' },
  ]

  return (
    <div className={classes.dashboard}>
      <Title order={1} className={classes.title}>Dashboard</Title>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </SimpleGrid>

      <div className={classes.sections}>
        <Paper className={classes.section}>
          <Text className={classes.sectionTitle}>Recent Memories</Text>
          <Text className={classes.emptyText}>No memories yet. Create your first memory to get started.</Text>
        </Paper>

        <Paper className={classes.section}>
          <Text className={classes.sectionTitle}>Quick Actions</Text>
          <Text className={classes.emptyText}>Actions will appear here once the system is connected.</Text>
        </Paper>
      </div>
    </div>
  )
}
