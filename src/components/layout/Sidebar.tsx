import { NavLink, useLocation } from 'react-router-dom'
import { Stack, Text, UnstyledButton, Tooltip } from '@mantine/core'
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
} from '@tabler/icons-react'
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

  return (
    <div className={classes.sidebar}>
      {/* Logo */}
      <div className={classes.logo}>
        <div className={classes.logoIcon}>
          <IconBrain size={28} stroke={1.5} />
        </div>
        {!collapsed && <Text className={classes.logoText}>Forgetful</Text>}
      </div>

      {/* Navigation */}
      <nav className={classes.nav}>
        <Stack gap={4}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            const button = (
              <NavLink to={item.path} className={classes.navLinkWrapper} key={item.path}>
                <UnstyledButton
                  className={classes.navItem}
                  data-active={isActive || undefined}
                >
                  <Icon size={20} stroke={1.5} />
                  {!collapsed && <span>{item.label}</span>}
                </UnstyledButton>
              </NavLink>
            )

            if (collapsed) {
              return (
                <Tooltip label={item.label} position="right" key={item.path}>
                  {button}
                </Tooltip>
              )
            }

            return button
          })}
        </Stack>
      </nav>

      {/* Collapse toggle */}
      <UnstyledButton className={classes.collapseToggle} onClick={onToggleCollapse}>
        {collapsed ? (
          <IconChevronRight size={18} stroke={1.5} />
        ) : (
          <>
            <IconChevronLeft size={18} stroke={1.5} />
            <span>Collapse</span>
          </>
        )}
      </UnstyledButton>
    </div>
  )
}
