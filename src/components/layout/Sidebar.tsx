import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Tooltip, Select } from '@mantine/core'
import {
  IconLayoutDashboard,
  IconBrain,
  IconBox,
  IconFolder,
  IconFileText,
  IconCode,
  IconShare3,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import { useProjectContext } from '@/context/ProjectContext'
import { useProjects } from '@/hooks/queries/useProjects'
import classes from './Sidebar.module.css'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  { path: '/memories', label: 'Memories', icon: IconBrain },
  { path: '/entities', label: 'Entities', icon: IconBox },
  { path: '/projects', label: 'Projects', icon: IconFolder },
  { path: '/documents', label: 'Documents', icon: IconFileText },
  { path: '/code-artifacts', label: 'Code Artifacts', icon: IconCode },
  { path: '/graph', label: 'Graph', icon: IconShare3 },
]

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation()
  const { selectedProjectId, setSelectedProject, clearProject } = useProjectContext()
  const { data: projectsData } = useProjects({ limit: 100 })

  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...(projectsData?.projects || [])
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .map(p => ({ value: String(p.id), label: p.name }))
  ]

  const selectedProject = projectsData?.projects?.find(p => p.id === selectedProjectId)

  // Keyboard shortcut Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        const select = document.querySelector('[data-project-selector]') as HTMLElement
        select?.click()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={classes.sidebar}>
      {/* Logo */}
      <div className={classes.logo}>
        <div className={classes.logoIcon}>
          <IconBrain size={22} stroke={1.5} />
        </div>
        {!collapsed && <span className={classes.logoText}>Forgetful</span>}
      </div>

      {/* Quick Search */}
      {!collapsed && (
        <div className={classes.searchBox}>
          <IconSearch size={18} className={classes.searchIcon} />
          <span className={classes.searchText}>Quick search...</span>
          <kbd className={classes.searchKbd}>⌘K</kbd>
        </div>
      )}

      {/* Project Context Selector */}
      {!collapsed && (
        <div className={classes.projectSelector}>
          <Select
            data-project-selector
            placeholder="All Projects"
            data={projectOptions}
            value={selectedProjectId ? String(selectedProjectId) : ''}
            onChange={(value) => setSelectedProject(value ? parseInt(value, 10) : null)}
            leftSection={<IconFolder size={16} />}
            rightSection={selectedProjectId ? (
              <IconX
                size={14}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  clearProject()
                }}
              />
            ) : undefined}
            styles={{
              input: {
                backgroundColor: 'var(--surface-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              },
              dropdown: {
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-subtle)',
              },
            }}
            classNames={{
              option: classes.selectOption,
            }}
            comboboxProps={{ withinPortal: true }}
          />
          {selectedProject && (
            <div className={classes.projectHint}>
              <kbd className={classes.searchKbd}>Ctrl+P</kbd>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className={classes.nav}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          const navLink = (
            <NavLink
              to={item.path}
              className={classes.navLinkWrapper}
              key={item.path}
            >
              <div
                className={classes.navItem}
                data-active={isActive || undefined}
              >
                <Icon size={20} stroke={1.5} />
                {!collapsed && <span className={classes.navLabel}>{item.label}</span>}
              </div>
            </NavLink>
          )

          if (collapsed) {
            return (
              <Tooltip label={item.label} position="right" key={item.path}>
                {navLink}
              </Tooltip>
            )
          }

          return navLink
        })}
      </nav>

      {/* Collapse toggle */}
      <button className={classes.collapseToggle} onClick={onToggleCollapse}>
        {collapsed ? (
          <IconChevronRight size={18} stroke={1.5} />
        ) : (
          <>
            <IconChevronLeft size={18} stroke={1.5} />
            <span className={classes.collapseText}>Collapse</span>
          </>
        )}
      </button>
    </div>
  )
}
