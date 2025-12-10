import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import { Sidebar } from './Sidebar'
import classes from './MainLayout.module.css'

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <AppShell
      navbar={{
        width: collapsed ? 64 : 240,
        breakpoint: 'sm',
      }}
      padding={0}
      className={classes.shell}
    >
      <AppShell.Navbar className={classes.navbar}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </AppShell.Navbar>

      <AppShell.Main className={classes.main}>
        <div className={classes.content}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}
