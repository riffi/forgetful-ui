import { useEffect, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import classes from './MarkdownEditor.module.css'

export type AccentColor = 'memory' | 'entity' | 'document' | 'code' | 'project'
export type ContentType = 'markdown' | 'code'

export interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  /** Click-to-edit mode: shows preview, click to open editor */
  inlineEdit?: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  accentColor?: AccentColor
  /** Content type: 'markdown' (default) or 'code' (plain textarea) */
  contentType?: ContentType
}

// Toolbar button component
function ToolbarButton({
  onClick,
  isActive,
  title,
  children
}: {
  onClick: () => void
  isActive?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${classes.toolbarButton} ${isActive ? classes.toolbarButtonActive : ''}`}
      title={title}
    >
      {children}
    </button>
  )
}

// Toolbar divider
function ToolbarDivider() {
  return <div className={classes.toolbarDivider} />
}

// Editor toolbar component
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  return (
    <div className={classes.toolbar}>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6V4zm0 8h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6v-8z" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="2"/>
          <line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" strokeWidth="2"/>
          <line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 5.5 7 8C7 10.5 9 11 12 12C15 13 17 13.5 17 16C17 18.5 14.5 20 12 20C9.5 20 8 18 8 18"/>
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="4" cy="6" r="2"/>
          <circle cx="4" cy="12" r="2"/>
          <circle cx="4" cy="18" r="2"/>
          <line x1="9" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
          <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
          <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
          <line x1="9" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 8H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H6V10h4V8zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2V10h4V8z"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <polyline points="9 9 6 12 9 15"/>
          <polyline points="15 9 18 12 15 15"/>
        </svg>
      </ToolbarButton>
    </div>
  )
}

// Code editor component (simple textarea)
function CodeEditor({
  value,
  onChange,
  placeholder,
  minHeight,
  maxHeight,
  accentColor,
  readOnly,
  inlineEdit,
}: Omit<MarkdownEditorProps, 'contentType'>) {
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle click outside to close editor in inlineEdit mode
  useEffect(() => {
    if (!inlineEdit || !isEditing) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false)
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [inlineEdit, isEditing])

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
  }

  // Read-only or preview mode
  if (readOnly || (inlineEdit && !isEditing)) {
    return (
      <div
        ref={containerRef}
        className={`${classes.container} ${classes[accentColor ?? 'memory']} ${inlineEdit ? classes.clickable : ''}`}
        onClick={inlineEdit ? () => setIsEditing(true) : undefined}
      >
        <div
          className={`${classes.codePreview} ${!value ? classes.previewEmpty : ''}`}
          style={{
            minHeight,
            maxHeight,
            overflow: maxHeight ? 'auto' : undefined,
          }}
        >
          {value || <em className={classes.placeholderText}>{placeholder}</em>}
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div
      ref={containerRef}
      className={`${classes.container} ${classes[accentColor ?? 'memory']}`}
    >
      <div className={classes.codeEditorWrapper}>
        <textarea
          ref={textareaRef}
          className={classes.codeTextarea}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            minHeight,
            maxHeight,
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
  inlineEdit = false,
  placeholder = 'Write markdown here...',
  minHeight = 200,
  maxHeight,
  accentColor = 'memory',
  contentType = 'markdown',
}: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // For code content, use simple textarea
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
        inlineEdit={inlineEdit}
      />
    )
  }

  // TipTap editor for markdown
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editable: !readOnly && (!inlineEdit || isEditing),
    onUpdate: ({ editor }) => {
      // Get markdown content from tiptap-markdown extension
      const storage = editor.storage as unknown as { markdown: { getMarkdown: () => string } }
      const markdown = storage.markdown.getMarkdown()
      onChange?.(markdown)
    },
  })

  // Sync value changes from parent
  useEffect(() => {
    if (editor) {
      const storage = editor.storage as unknown as { markdown: { getMarkdown: () => string } }
      if (value !== storage.markdown.getMarkdown()) {
        editor.commands.setContent(value)
      }
    }
  }, [value, editor])

  // Update editable state when isEditing changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly && (!inlineEdit || isEditing))
    }
  }, [editor, readOnly, inlineEdit, isEditing])

  // Handle click outside to close editor in inlineEdit mode
  useEffect(() => {
    if (!inlineEdit || !isEditing) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false)
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [inlineEdit, isEditing])

  // Focus editor when entering edit mode
  useEffect(() => {
    if (isEditing && editor) {
      editor.commands.focus('end')
    }
  }, [isEditing, editor])

  // Read-only mode or preview mode (inline edit, not editing)
  if (readOnly || (inlineEdit && !isEditing)) {
    return (
      <div
        ref={containerRef}
        className={`${classes.container} ${classes[accentColor]} ${inlineEdit ? classes.clickable : ''}`}
        onClick={inlineEdit ? () => setIsEditing(true) : undefined}
      >
        <div
          className={`${classes.tiptapPreview} ${!value ? classes.previewEmpty : ''}`}
          style={{
            minHeight,
            maxHeight,
            overflow: maxHeight ? 'auto' : undefined,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div
      ref={containerRef}
      className={`${classes.container} ${classes[accentColor]} ${classes.editorActive}`}
      style={{
        '--editor-min-height': `${minHeight}px`,
      } as React.CSSProperties}
    >
      <EditorToolbar editor={editor} />
      <div
        className={classes.tiptapEditor}
        style={{
          minHeight: minHeight - 45,
          maxHeight: maxHeight ? maxHeight - 45 : undefined,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
