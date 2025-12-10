import { useState } from 'react'
import { IconAlertTriangle, IconX } from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import classes from './AuthWarning.module.css'

export function AuthWarning() {
  const { authMode } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (authMode !== 'disabled' || dismissed) {
    return null
  }

  return (
    <div className={classes.warningBar}>
      <IconAlertTriangle size={14} />
      <span className={classes.warningText}>
        <strong>Auth disabled</strong> — Server running without authentication
      </span>
      <button
        className={classes.closeBtn}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <IconX size={14} />
      </button>
    </div>
  )
}
