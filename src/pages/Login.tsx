import { Paper, Text, Button, Box } from '@mantine/core'
import { IconBrain, IconBrandGithub, IconLock } from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import classes from './Login.module.css'

export function Login() {
  const { login, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className={classes.container}>
        <Paper className={classes.card}>
          <div className={classes.logo}>
            <div className={classes.logoIcon}>
              <IconBrain size={32} stroke={1.5} />
            </div>
            <Text className={classes.logoText}>Forgetful</Text>
          </div>
          <Text c="dimmed" ta="center">Loading...</Text>
        </Paper>
      </div>
    )
  }

  return (
    <div className={classes.container}>
      <Paper className={classes.card}>
        {/* Logo */}
        <div className={classes.logo}>
          <div className={classes.logoIcon}>
            <IconBrain size={32} stroke={1.5} />
          </div>
          <Text className={classes.logoText}>Forgetful</Text>
        </div>

        {/* Heading */}
        <Text className={classes.heading}>Sign in to continue</Text>
        <Text className={classes.subheading}>Authenticate to access your memories</Text>

        {/* Sign in button */}
        <Button
          className={classes.providerButton}
          leftSection={<IconBrandGithub size={20} />}
          onClick={() => login()}
          mt="xl"
          fullWidth
          justify="center"
          style={{ '--provider-color': '#333' } as React.CSSProperties}
        >
          Continue with GitHub
        </Button>

        {/* Footer */}
        <Box className={classes.footer}>
          <IconLock size={14} />
          <Text size="xs">Your data stays private</Text>
        </Box>
      </Paper>
    </div>
  )
}
