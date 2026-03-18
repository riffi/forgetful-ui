import { ReactNode } from 'react'
import {
  Modal,
  Text,
  Group,
  Stack,
  Button,
} from '@mantine/core'
import { IconAlertTriangle, IconX } from '@tabler/icons-react'
import classes from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  icon?: ReactNode
  isLoading?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',
  icon,
  isLoading,
  children,
}: ConfirmDialogProps) {
  const defaultIcon = <IconAlertTriangle size={24} className={classes.defaultIcon} />

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          {icon || defaultIcon}
          <Text fw={600} size="lg">{title}</Text>
        </Group>
      }
      size="md"
      centered
      classNames={{
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      <Stack gap="lg">
        {children ? (
          children
        ) : message ? (
          <Text size="sm" c="dimmed" className={classes.message}>
            {message}
          </Text>
        ) : null}

        <Group justify="flex-end" className={classes.actions}>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconX size={16} />}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            color={confirmColor}
            onClick={onConfirm}
            loading={isLoading}
            className={classes.confirmBtn}
            data-color={confirmColor}
          >
            {confirmText}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
