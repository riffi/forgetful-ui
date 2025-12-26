import { useState } from 'react'
import { Paper, Text, Button, Textarea, Stack, SimpleGrid, Divider } from '@mantine/core'
import { IconBrandGithub, IconBrandGoogle, IconLogout } from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import { Breadcrumb } from '@/components/ui'
import classes from './UserProfile.module.css'

export function UserProfile() {
  const { user, logout, oauthProviders } = useAuth()
  const [notes, setNotes] = useState(user?.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Get provider info
  const provider = oauthProviders[0] || 'oauth'
  const providerIcons: Record<string, typeof IconBrandGithub> = {
    github: IconBrandGithub,
    google: IconBrandGoogle,
  }
  const ProviderIcon = providerIcons[provider] || IconBrandGithub

  // Get user initials for avatar
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const handleNotesChange = (value: string) => {
    setNotes(value)
    setHasChanges(value !== (user?.notes || ''))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Call API to update user notes
      // await apiClient.patch('/users/me', { notes })
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className={classes.container}>
      <Breadcrumb items={[{ title: 'Profile', href: '/profile' }]} />

      {/* Header with avatar and name */}
      <div className={classes.header}>
        <div className={classes.avatar}>
          {initials}
        </div>
        <div className={classes.headerInfo}>
          <Text className={classes.userName}>{user?.name || 'Unknown User'}</Text>
          <Text className={classes.userEmail}>{user?.email || 'No email'}</Text>
        </div>
      </div>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" className={classes.content}>
        {/* User Info Card */}
        <Paper className={classes.card}>
          <Text className={classes.cardTitle}>Account Information</Text>

          <Stack gap="md">
            <div className={classes.field}>
              <Text className={classes.fieldLabel}>Account ID</Text>
              <Text className={classes.fieldValueMono}>{user?.id || 'Unknown'}</Text>
            </div>

            <div className={classes.field}>
              <Text className={classes.fieldLabel}>Notes</Text>
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.currentTarget.value)}
                placeholder="Add personal notes..."
                minRows={4}
                classNames={{
                  input: classes.notesInput,
                }}
              />
            </div>

            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!hasChanges}
              className={classes.saveButton}
            >
              Save Changes
            </Button>
          </Stack>
        </Paper>

        {/* Session Info Card */}
        <Paper className={classes.card}>
          <Text className={classes.cardTitle}>Session</Text>

          <Stack gap="md">
            <div className={classes.field}>
              <Text className={classes.fieldLabel}>Signed in via</Text>
              <div className={classes.providerBadge}>
                <ProviderIcon size={18} />
                <Text>{provider.charAt(0).toUpperCase() + provider.slice(1)}</Text>
              </div>
            </div>

            <div className={classes.field}>
              <Text className={classes.fieldLabel}>Member since</Text>
              <Text className={classes.fieldValue}>{formatDate(user?.created_at)}</Text>
            </div>

            <Divider my="sm" color="var(--border-subtle)" />

            <Button
              variant="outline"
              color="red"
              leftSection={<IconLogout size={18} />}
              onClick={logout}
              fullWidth
              className={classes.logoutButton}
            >
              Sign out
            </Button>
          </Stack>
        </Paper>
      </SimpleGrid>
    </div>
  )
}
