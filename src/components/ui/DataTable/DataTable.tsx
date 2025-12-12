import { ReactNode } from 'react'
import { Table, TextInput, Button, Group, Text, Loader } from '@mantine/core'
import { IconSearch, IconPlus } from '@tabler/icons-react'
import classes from './DataTable.module.css'

export type ItemType = 'memory' | 'document' | 'code' | 'entity' | 'project'

export interface DataTableColumn<T> {
  key: string
  title: string
  width?: number | string
  render: (item: T) => ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  loading?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  linkButtonLabel?: string
  onLinkClick?: () => void
  onRowClick?: (item: T) => void
  emptyIcon?: ReactNode
  emptyText?: string
  getRowKey: (item: T) => string | number
}

export function DataTable<T>({
  data,
  columns,
  loading,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  linkButtonLabel,
  onLinkClick,
  onRowClick,
  emptyIcon,
  emptyText = 'No items found',
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div className={classes.container}>
      {/* Toolbar */}
      {(onSearchChange || linkButtonLabel) && (
        <div className={classes.toolbar}>
          <div className={classes.toolbarLeft}>
            {onSearchChange && (
              <TextInput
                placeholder={searchPlaceholder}
                leftSection={<IconSearch size={14} />}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className={classes.search}
              />
            )}
          </div>
          <div className={classes.toolbarRight}>
            {linkButtonLabel && onLinkClick && (
              <Button
                variant="default"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={onLinkClick}
              >
                {linkButtonLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : data.length > 0 ? (
        /* Table */
        <Table className={classes.table}>
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.title}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((item) => (
              <Table.Tr
                key={getRowKey(item)}
                className={`${classes.row} ${onRowClick ? classes.rowClickable : ''}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col) => (
                  <Table.Td key={col.key}>{col.render(item)}</Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        /* Empty State */
        <div className={classes.empty}>
          {emptyIcon}
          <Text c="dimmed">{emptyText}</Text>
        </div>
      )}
    </div>
  )
}

// Helper components for common cell types
export function TypeDot({ type }: { type: ItemType }) {
  return <span className={classes.typeDot} data-type={type} />
}

export function TitleCell({ type, children }: { type: ItemType; children: ReactNode }) {
  return (
    <div className={classes.titleCell}>
      <TypeDot type={type} />
      {children}
    </div>
  )
}

export function TableLink({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <span className={classes.link} onClick={onClick}>
      {children}
    </span>
  )
}

export function TagList({ tags, max = 2 }: { tags?: string[]; max?: number }) {
  if (!tags?.length) return null

  return (
    <div className={classes.tags}>
      {tags.slice(0, max).map((tag) => (
        <span key={tag} className={classes.tag}>
          {tag}
        </span>
      ))}
      {tags.length > max && (
        <Text size="xs" c="dimmed">
          +{tags.length - max}
        </Text>
      )}
    </div>
  )
}

export function ImportanceValue({ value }: { value: number }) {
  const level = value >= 9 ? 'high' : value >= 7 ? 'medium' : 'low'
  return (
    <span className={classes.importance} data-level={level}>
      {value}
    </span>
  )
}

export function DateCell({ date }: { date: string | Date }) {
  return (
    <span className={classes.date}>
      {new Date(date).toLocaleDateString()}
    </span>
  )
}

export function ActionLink({
  onClick,
  danger,
  children,
}: {
  onClick?: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      className={`${classes.action} ${danger ? classes.actionDanger : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {children}
    </button>
  )
}

export function LanguageCell({ language }: { language: string }) {
  return <span className={classes.language}>{language}</span>
}

export function TypeBadge({ type }: { type: string }) {
  return <span className={classes.typeBadge}>{type}</span>
}

// Re-export classes for custom styling
export { classes as dataTableClasses }
