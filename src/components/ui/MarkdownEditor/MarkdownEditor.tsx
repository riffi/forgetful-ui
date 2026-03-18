import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { IconMarkdown, IconAlignLeft } from '@tabler/icons-react'
import classes from './MarkdownEditor.module.css'

export type AccentColor = 'memory' | 'entity' | 'document' | 'code' | 'project'
type ViewMode = 'plain' | 'markdown'

export interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  accentColor?: AccentColor
  label?: string
}

// View mode toggle button
function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
  disabled?: boolean
}) {
  return (
    <div className={classes.modeToggle}>
      <button
        type="button"
        className={`${classes.modeButton} ${mode === 'plain' ? classes.modeButtonActive : ''}`}
        onClick={() => onChange('plain')}
        disabled={disabled}
        title="Plain text"
      >
        <IconAlignLeft size={14} />
        <span>Plain</span>
      </button>
      <button
        type="button"
        className={`${classes.modeButton} ${mode === 'markdown' ? classes.modeButtonActive : ''}`}
        onClick={() => onChange('markdown')}
        disabled={disabled}
        title="Markdown preview"
      >
        <IconMarkdown size={14} />
        <span>Markdown</span>
      </button>
    </div>
  )
}

// Markdown preview using TipTap (read-only)
function MarkdownPreview({
  value,
  minHeight,
  maxHeight,
  placeholder,
}: {
  value: string
  minHeight?: number
  maxHeight?: number
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
      }),
    ],
    content: value,
    editable: false,
  })

  // Sync content when value changes
  useEffect(() => {
    if (editor && value !== undefined) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!value) {
    return (
      <div
        className={`${classes.preview} ${classes.previewEmpty}`}
        style={{ minHeight, maxHeight }}
      >
        <em className={classes.placeholderText}>{placeholder || 'No content'}</em>
      </div>
    )
  }

  return (
    <div
      className={classes.preview}
      style={{
        minHeight,
        maxHeight,
        overflow: maxHeight ? 'auto' : undefined,
      }}
    >
      <EditorContent editor={editor} />
    </div>
  )
}

// Source editor (textarea with auto-resize)
function SourceEditor({
  value,
  onChange,
  placeholder,
  minHeight = 200,
  readOnly,
}: {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  minHeight?: number
  readOnly?: boolean
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to fit content
  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`
    }
  }

  // Adjust on mount and when value changes
  useEffect(() => {
    adjustHeight()
  }, [value, minHeight])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
    adjustHeight()
  }

  return (
    <textarea
      ref={textareaRef}
      className={classes.sourceTextarea}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        minHeight: `${minHeight}px`,
      }}
    />
  )
}

// Main MarkdownEditor component
export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Write markdown here...',
  minHeight = 200,
  maxHeight,
  accentColor = 'memory',
  label,
}: MarkdownEditorProps) {
  // Toggle between plain text and markdown preview (default to plain)
  const [mode, setMode] = useState<ViewMode>('plain')

  return (
    <div className={`${classes.container} ${classes[accentColor]}`}>
      <div className={classes.toolbar}>
        {label && <span className={classes.label}>{label}</span>}
        <ModeToggle mode={mode} onChange={setMode} disabled={readOnly} />
      </div>
      <div className={classes.editorWrapper}>
        {mode === 'markdown' ? (
          <MarkdownPreview
            value={value}
            minHeight={minHeight}
            maxHeight={maxHeight}
            placeholder={placeholder}
          />
        ) : (
          <SourceEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            minHeight={minHeight}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  )
}
