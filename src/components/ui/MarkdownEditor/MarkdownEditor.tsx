import { useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { IconEye, IconCode } from '@tabler/icons-react'
import classes from './MarkdownEditor.module.css'

export type AccentColor = 'memory' | 'entity' | 'document' | 'code' | 'project'
export type ContentType = 'markdown' | 'code'
type ViewMode = 'preview' | 'source'

export interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  accentColor?: AccentColor
  /** Content type: 'markdown' (default) or 'code' (plain textarea, no preview) */
  contentType?: ContentType
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
        className={`${classes.modeButton} ${mode === 'preview' ? classes.modeButtonActive : ''}`}
        onClick={() => onChange('preview')}
        disabled={disabled}
        title="Preview"
      >
        <IconEye size={14} />
        <span>Preview</span>
      </button>
      <button
        type="button"
        className={`${classes.modeButton} ${mode === 'source' ? classes.modeButtonActive : ''}`}
        onClick={() => onChange('source')}
        disabled={disabled}
        title="Source"
      >
        <IconCode size={14} />
        <span>Source</span>
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

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current && !readOnly) {
      textareaRef.current.focus()
    }
  }, [readOnly])

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

// Code editor (always shows textarea, no preview toggle)
function CodeEditor({
  value,
  onChange,
  placeholder,
  minHeight,
  maxHeight,
  accentColor,
  readOnly,
}: Omit<MarkdownEditorProps, 'contentType'>) {
  const height = Math.max(minHeight || 200, 200)

  return (
    <div className={`${classes.container} ${classes[accentColor ?? 'memory']}`}>
      <div className={classes.editorWrapper}>
        <textarea
          className={classes.codeTextarea}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            height: `${height}px`,
            maxHeight: maxHeight ? `${maxHeight}px` : undefined,
          }}
        />
      </div>
    </div>
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
  contentType = 'markdown',
}: MarkdownEditorProps) {
  // For code content, use simple textarea without toggle
  if (contentType === 'code') {
    return (
      <CodeEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minHeight={minHeight}
        maxHeight={maxHeight}
        accentColor={accentColor}
        readOnly={readOnly}
      />
    )
  }

  // For markdown: toggle between preview and source (default to preview)
  const [mode, setMode] = useState<ViewMode>('preview')

  // Switch to preview when becoming read-only
  useEffect(() => {
    if (readOnly) {
      setMode('preview')
    }
  }, [readOnly])

  return (
    <div className={`${classes.container} ${classes[accentColor]}`}>
      {!readOnly && (
        <div className={classes.toolbar}>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      )}
      <div className={classes.editorWrapper}>
        {mode === 'preview' ? (
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
