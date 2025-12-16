import { Menu, Text, Tooltip } from '@mantine/core'
import { IconUser, IconLogout, IconChevronRight } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import classes from './UserProfileDropdown.module.css'

interface UserProfileDropdownProps {
  collapsed: boolean
}

export function UserProfileDropdown({ collapsed }: UserProfileDropdownProps) {
  const navigate = useNavigate()
  const { user, logout, authMode, isAuthenticated } = useAuth()

  // Get user initials for avatar
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  // Show guest mode when auth is disabled
  const isGuest = authMode === 'disabled'
  const displayName = isGuest ? 'Guest' : (user?.name || 'User')

  const content = (
    <Menu position="top-start" offset={4} withinPortal>
      <Menu.Target>
        <div className={classes.container} data-guest={isGuest || undefined}>
          <div className={classes.avatar} data-guest={isGuest || undefined}>
            {isGuest ? <IconUser size={16} /> : initials}
          </div>
          {!collapsed && (
            <>
              <div className={classes.info}>
                <Text className={classes.name} lineClamp={1}>{displayName}</Text>
                {!isGuest && user?.email && (
                  <Text className={classes.email} lineClamp={1}>{user.email}</Text>
                )}
              </div>
              <IconChevronRight size={16} className={classes.chevron} />
            </>
          )}
        </div>
      </Menu.Target>

      <Menu.Dropdown className={classes.dropdown}>
        {!isGuest && (
          <>
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={() => navigate('/profile')}
            >
              Profile
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconLogout size={16} />}
              onClick={logout}
              color="red"
            >
              Sign out
            </Menu.Item>
          </>
        )}
        {isGuest && (
          <Menu.Item disabled>
            <Text size="sm" c="dimmed">Authentication disabled</Text>
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  )

  if (collapsed) {
    return (
      <Tooltip label={displayName} position="right">
        {content}
      </Tooltip>
    )
  }

  return content
}
