import { useEffect, useState, useRef } from 'react'
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor'
import type { PluggableList } from 'unified'
import classes from './MarkdownEditor.module.css'

// Heading dropdown command with H icon
const headingGroup: ICommand = commands.group(
  [commands.title1, commands.title2, commands.title3, commands.title4, commands.title5, commands.title6],
  {
    name: 'heading',
    groupName: 'heading',
    buttonProps: { 'aria-label': 'Headings', title: 'Headings' },
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 2h2v5h6V2h2v12h-2V9H5v5H3V2z" />
      </svg>
    ),
  }
)

export type AccentColor = 'memory' | 'entity' | 'document' | 'code' | 'project'

export interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  /** Click-to-edit mode: shows preview, click to open editor */
  inlineEdit?: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  previewMode?: 'live' | 'edit' | 'preview'
  accentColor?: AccentColor
  // Extensibility
  remarkPlugins?: PluggableList
  rehypePlugins?: PluggableList
}

// Set dark mode globally for the editor
function setDarkMode() {
  document.documentElement.setAttribute('data-color-mode', 'dark')
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  inlineEdit = false,
  placeholder = 'Write markdown here...',
  minHeight = 200,
  maxHeight,
  previewMode = 'live',
  accentColor = 'memory',
  remarkPlugins,
  rehypePlugins,
}: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Ensure dark mode is set
  useEffect(() => {
    setDarkMode()
  }, [])

  // Handle click outside to close editor in inlineEdit mode
  useEffect(() => {
    if (!inlineEdit || !isEditing) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false)
      }
    }

    // Delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [inlineEdit, isEditing])

  const handleChange = (val?: string) => {
    if (onChange) {
      onChange(val ?? '')
    }
  }

  // Map previewMode to MDEditor's preview prop
  const preview = previewMode === 'live' ? 'live' : previewMode

  // Toolbar commands - customized set
  const toolbarCommands = [
    commands.bold,
    commands.italic,
    commands.strikethrough,
    commands.divider,
    headingGroup,
    commands.divider,
    commands.unorderedListCommand,
    commands.orderedListCommand,
    commands.checkedListCommand,
    commands.divider,
    commands.link,
    commands.quote,
    commands.code,
    commands.codeBlock,
    commands.divider,
    commands.table,
  ]

  // Read-only mode: use MDEditor.Markdown for clean rendering
  if (readOnly) {
    return (
      <div className={`${classes.container} ${classes[accentColor]}`} data-color-mode="dark">
        <MDEditor.Markdown
          source={value || placeholder}
          className={classes.preview}
          style={{
            minHeight,
            maxHeight,
            overflow: maxHeight ? 'auto' : undefined,
          }}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        />
      </div>
    )
  }

  // Inline edit mode: click to edit, click outside to close
  if (inlineEdit && !isEditing) {
    return (
      <div
        ref={containerRef}
        className={`${classes.container} ${classes[accentColor]} ${classes.clickable}`}
        data-color-mode="dark"
        onClick={() => setIsEditing(true)}
      >
        <MDEditor.Markdown
          source={value || `*${placeholder}*`}
          className={`${classes.preview} ${classes.previewClickable} ${!value ? classes.previewEmpty : ''}`}
          style={{
            minHeight,
            maxHeight,
            overflow: maxHeight ? 'auto' : undefined,
          }}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        />
      </div>
    )
  }

  // Edit mode: full editor
  // Calculate height based on content - approximately 20px per line + toolbar (50px)
  const lineCount = (value || '').split('\n').length
  const contentBasedHeight = Math.max(lineCount * 22 + 80, minHeight)
  // For inlineEdit: use content-based height, capped at maxHeight if set
  const editorHeight = inlineEdit
    ? maxHeight
      ? Math.min(contentBasedHeight, maxHeight)
      : contentBasedHeight
    : Math.max(minHeight, 200)
  const editorPreview = inlineEdit ? 'edit' : preview

  return (
    <div
      ref={inlineEdit ? containerRef : undefined}
      className={`${classes.container} ${classes[accentColor]} ${inlineEdit ? classes.inlineEditor : ''}`}
      data-color-mode="dark"
      style={{
        '--editor-min-height': `${minHeight}px`,
      } as React.CSSProperties}
    >
      <MDEditor
        value={value}
        onChange={handleChange}
        preview={editorPreview}
        commands={toolbarCommands}
        height={inlineEdit ? '100%' : editorHeight}
        visibleDragbar={false}
        textareaProps={{
          placeholder,
          autoFocus: inlineEdit,
        }}
        previewOptions={{
          remarkPlugins,
          rehypePlugins,
        }}
      />
    </div>
  )
}
