import { NavLink, useLocation } from 'react-router-dom'
import { Tooltip } from '@mantine/core'
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
