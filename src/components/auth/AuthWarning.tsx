import { useState } from 'react'
import { Alert, CloseButton, Group, Text } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import classes from './AuthWarning.module.css'

export function AuthWarning() {
  const { authMode } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (authMode !== 'disabled' || dismissed) {
    return null
  }

  return (
    <Alert
      className={classes.warning}
      icon={<IconAlertTriangle size={20} />}
      color="yellow"
      variant="filled"
    >
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm">
          <strong>Authorization disabled.</strong> Server is running without authentication.
          This may be unsafe in production.
        </Text>
        <CloseButton
          onClick={() => setDismissed(true)}
          variant="transparent"
          c="yellow.9"
        />
      </Group>
    </Alert>
  )
}
