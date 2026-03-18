import { Text } from '@mantine/core'
import { IconUnlink, IconBrain } from '@tabler/icons-react'
import { ConfirmDialog } from './ConfirmDialog'
import classes from './ConfirmUnlinkModal.module.css'

interface ConfirmUnlinkModalProps {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  sourceTitle: string
  targetTitle: string
  isLoading?: boolean
}

export function ConfirmUnlinkModal({
  opened,
  onClose,
  onConfirm,
  sourceTitle,
  targetTitle,
  isLoading,
}: ConfirmUnlinkModalProps) {
  return (
    <ConfirmDialog
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Unlink Memories"
      confirmText="Unlink"
      confirmColor="red"
      icon={<IconUnlink size={24} className={classes.headerIcon} />}
      isLoading={isLoading}
    >
      <div className={classes.unlinkPreview}>
        <div className={classes.memoryCard}>
          <IconBrain size={16} className={classes.memoryIcon} />
          <Text size="sm" fw={500} lineClamp={1}>{sourceTitle}</Text>
        </div>

        <div className={classes.unlinkLine}>
          <div className={classes.dashedLine} />
          <IconUnlink size={20} className={classes.unlinkIcon} />
          <div className={classes.dashedLine} />
        </div>

        <div className={classes.memoryCard}>
          <IconBrain size={16} className={classes.memoryIcon} />
          <Text size="sm" fw={500} lineClamp={1}>{targetTitle}</Text>
        </div>
      </div>

      <Text size="sm" c="dimmed" ta="center">
        This will remove the connection between these memories.
        The memories themselves will not be deleted.
      </Text>
    </ConfirmDialog>
  )
}
