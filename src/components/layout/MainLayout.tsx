import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import { IconFolder, IconX } from '@tabler/icons-react'
import { Sidebar } from './Sidebar'
import { AuthWarning } from '@/components/auth'
import { QuickEditPanel } from '@/components/panels'
import { GlobalSearch } from '@/components/search'
import { useProjectContext } from '@/context/ProjectContext'
import { useQuickEdit } from '@/context/QuickEditContext'
import { useProject } from '@/hooks/queries/useProjects'
import classes from './MainLayout.module.css'

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { selectedProjectId, clearProject } = useProjectContext()
  const { isOpen: isPanelOpen } = useQuickEdit()
  const { data: selectedProject } = useProject(selectedProjectId ?? 0)

  return (
    <AppShell
      navbar={{
        width: collapsed ? 72 : 260,
        breakpoint: 'sm',
      }}
      padding={0}
      className={classes.shell}
    >
      <AppShell.Navbar className={classes.navbar}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </AppShell.Navbar>

      <AppShell.Main className={`${classes.main} ${isPanelOpen ? classes.mainWithPanel : ''}`}>
        <AuthWarning />
        {selectedProjectId && selectedProject && (
          <div className={classes.projectContextBar}>
            <div className={classes.projectContextInfo}>
              <IconFolder size={14} />
              <span>{selectedProject.name}</span>
            </div>
            <button className={classes.projectContextClear} onClick={clearProject}>
              <span>Clear filter</span>
              <IconX size={14} />
            </button>
          </div>
        )}
        <div className={classes.content}>
          <Outlet />
        </div>
      </AppShell.Main>
      <QuickEditPanel />
      <GlobalSearch />
    </AppShell>
  )
}
