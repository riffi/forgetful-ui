import { useState, useRef, KeyboardEvent } from 'react'
import { IconX } from '@tabler/icons-react'
import classes from './Tags.module.css'

export type TagVariant = 'default' | 'memory' | 'entity' | 'document' | 'code' | 'project' | 'keyword'

// =============================================================================
// TAG LIST (Display only)
// =============================================================================

export interface TagListProps {
  tags?: string[]
  variant?: TagVariant
  max?: number
  emptyText?: string
}

export function TagList({ tags, variant = 'default', max, emptyText }: TagListProps) {
  if (!tags?.length) {
    return emptyText ? <span className={classes.empty}>{emptyText}</span> : null
  }

  const visibleTags = max ? tags.slice(0, max) : tags
  const hiddenCount = max ? tags.length - max : 0

  const getTagClass = (v: TagVariant) => {
    switch (v) {
      case 'memory': return classes.tagMemory
      case 'entity': return classes.tagEntity
      case 'document': return classes.tagDocument
      case 'code': return classes.tagCode
      case 'project': return classes.tagProject
      case 'keyword': return classes.tagKeyword
      default: return classes.tag
    }
  }

  return (
    <div className={classes.container}>
      {visibleTags.map((tag) => (
        <span key={tag} className={getTagClass(variant)}>
          {tag}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className={classes.more}>+{hiddenCount}</span>
      )}
    </div>
  )
}

// =============================================================================
// TAGS EDITOR (Editable)
// =============================================================================

export interface TagsEditorProps {
  value: string[]
  onChange: (tags: string[]) => void
  variant?: TagVariant
  placeholder?: string
  accentColor?: 'memory' | 'entity' | 'document' | 'code' | 'project'
}

export function TagsEditor({
  value,
  onChange,
  variant = 'default',
  placeholder = '+ tag',
  accentColor = 'memory',
}: TagsEditorProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRemove = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleAdd = (newTag: string) => {
    const trimmed = newTag.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      handleAdd(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace if input is empty
      handleRemove(value[value.length - 1])
    }
  }

  const getTagClass = (v: TagVariant) => {
    switch (v) {
      case 'memory': return classes.tagMemory
      case 'entity': return classes.tagEntity
      case 'document': return classes.tagDocument
      case 'code': return classes.tagCode
      case 'project': return classes.tagProject
      case 'keyword': return classes.tagKeyword
      default: return classes.tag
    }
  }

  const editorClass = accentColor === 'entity'
    ? `${classes.editor} ${classes.editorEntity}`
    : classes.editor

  return (
    <div className={editorClass} onClick={() => inputRef.current?.focus()}>
      {value.map((tag) => (
        <span key={tag} className={getTagClass(variant)}>
          {tag}
          <button
            type="button"
            className={classes.tagRemove}
            onClick={(e) => {
              e.stopPropagation()
              handleRemove(tag)
            }}
          >
            <IconX size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        className={classes.input}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) {
            handleAdd(inputValue)
          }
        }}
        placeholder={placeholder}
      />
    </div>
  )
}

// =============================================================================
// INLINE TAG (Single clickable tag)
// =============================================================================

export interface InlineTagProps {
  children: string
  variant?: TagVariant
  onClick?: () => void
  onRemove?: () => void
}

export function InlineTag({ children, variant = 'default', onClick, onRemove }: InlineTagProps) {
  const getTagClass = (v: TagVariant) => {
    switch (v) {
      case 'memory': return classes.tagMemory
      case 'entity': return classes.tagEntity
      case 'document': return classes.tagDocument
      case 'code': return classes.tagCode
      case 'project': return classes.tagProject
      case 'keyword': return classes.tagKeyword
      default: return classes.tag
    }
  }

  return (
    <span
      className={getTagClass(variant)}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          className={classes.tagRemove}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <IconX size={12} />
        </button>
      )}
    </span>
  )
}
