import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor'
import type { PluggableList } from 'unified'
import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki'
import classes from './MarkdownEditor.module.css'

// Shiki highlighter singleton (lazy loaded)
let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['one-dark-pro'],
      langs: ['yaml', 'json', 'xml', 'html', 'css', 'javascript', 'typescript', 'tsx', 'jsx', 'python', 'bash', 'sql', 'markdown', 'ini', 'toml'],
    })
  }
  return highlighterPromise
}

// Detect content format and language
type ContentFormat = 'yaml' | 'markdown' | 'other'
type DetectionResult = { format: ContentFormat; language: string }

function detectFormat(content: string): DetectionResult {
  if (!content || !content.trim()) return { format: 'markdown', language: 'markdown' }

  const trimmed = content.trim()

  // STEP 1: Check for STRONG markdown indicators FIRST (these are unambiguous)
  const strongMarkdownPatterns = [
    /\*\*[^*]+\*\*/,           // **bold**
    /\[.+\]\(.+\)/,            // [link](url)
    /^```/m,                   // code blocks
    /!\[.+\]\(.+\)/,           // ![image](url)
  ]

  for (const pattern of strongMarkdownPatterns) {
    if (pattern.test(trimmed)) {
      return { format: 'markdown', language: 'markdown' }
    }
  }

  // STEP 2: Check for frontmatter (markdown with YAML header)
  if (trimmed.startsWith('---')) {
    const lines = trimmed.split('\n')
    const closingIndex = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
    if (closingIndex > 0 && closingIndex < lines.length - 1) {
      const afterFrontmatter = lines.slice(closingIndex + 1).join('\n')
      if (afterFrontmatter.trim()) {
        return { format: 'markdown', language: 'markdown' }
      }
    }
    return { format: 'yaml', language: 'yaml' }
  }

  // STEP 3: Use heuristics for common formats
  const firstLine = trimmed.split('\n')[0].trim()

  // JSON detection
  if (firstLine.startsWith('{') || firstLine.startsWith('[')) {
    return { format: 'other', language: 'json' }
  }

  // HTML/XML detection
  if (/^<(!DOCTYPE|html|xml|\?xml|[a-zA-Z])/i.test(firstLine)) {
    return { format: 'other', language: 'xml' }
  }

  // CSS detection
  if (/^([.#@:][a-zA-Z_-]|[a-zA-Z][a-zA-Z0-9_-]*\s*\{|\/\*)/.test(firstLine)) {
    return { format: 'other', language: 'css' }
  }

  // INI/TOML detection
  if (/^\[{1,2}[a-zA-Z_][a-zA-Z0-9_.-]*\]{1,2}$/.test(firstLine) ||
      /^[a-zA-Z_][a-zA-Z0-9_-]*\s*=/.test(firstLine)) {
    return { format: 'other', language: 'ini' }
  }

  // JS/TS/TSX/JSX detection
  if (/^(module\.exports|export\s+(default|const|let|var|function)|const\s+|let\s+|var\s+|function\s+|import\s+|class\s+)/.test(firstLine)) {
    // Check for JSX/TSX indicators (React imports, JSX syntax, type annotations)
    const hasJsx = /<[A-Z][a-zA-Z]*|<\/|\/>/m.test(trimmed)
    const hasReactImport = /from\s+['"]react['"]/m.test(trimmed)
    const hasTypeAnnotations = /:\s*(React\.|JSX\.|string|number|boolean|\{|<)/m.test(trimmed) ||
                               /interface\s+\w+|type\s+\w+\s*=/m.test(trimmed)

    if (hasJsx || hasReactImport) {
      // Default to TSX for React files (TSX highlighter handles JSX fine)
      return { format: 'other', language: 'tsx' }
    }
    if (hasTypeAnnotations) {
      return { format: 'other', language: 'typescript' }
    }
    return { format: 'other', language: 'javascript' }
  }

  // Python detection (includes docstrings and decorators)
  if (/^(def\s+|class\s+|import\s+|from\s+|if\s+__name__|#!.*python|"""|'''|@\w+)/.test(firstLine)) {
    return { format: 'other', language: 'python' }
  }

  // Bash detection
  if (/^#!\/bin\/(ba)?sh/.test(firstLine) || /^(export\s+|alias\s+|source\s+|\$\()/.test(firstLine)) {
    return { format: 'other', language: 'bash' }
  }

  // SQL detection
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE)\s+/i.test(firstLine)) {
    return { format: 'other', language: 'sql' }
  }

  // YAML detection - find first non-comment, non-empty line
  const lines = trimmed.split('\n')
  const firstContentLine = lines.find(l => {
    const t = l.trim()
    return t && !t.startsWith('#')
  })

  if (firstContentLine && /^[a-zA-Z_][a-zA-Z0-9_-]*\s*:/.test(firstContentLine.trim())) {
    // Count YAML-like lines
    let yamlLikeLines = 0
    let totalLines = 0

    for (const line of lines) {
      const t = line.trim()
      if (!t) continue
      totalLines++
      if (/^[a-zA-Z_][a-zA-Z0-9_-]*\s*:/.test(t) || /^-\s+/.test(t) || t.startsWith('#')) {
        yamlLikeLines++
      }
    }

    if (totalLines >= 2 && yamlLikeLines / totalLines >= 0.7) {
      return { format: 'yaml', language: 'yaml' }
    }
  }

  // Default to markdown
  return { format: 'markdown', language: 'markdown' }
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Detect format (YAML vs Markdown vs Other) and language
  const { format, language } = useMemo(() => detectFormat(value), [value])

  // Ensure dark mode is set
  useEffect(() => {
    setDarkMode()
  }, [])

  // Auto-focus textarea when entering YAML or Other edit mode
  useEffect(() => {
    if (isEditing && (format === 'yaml' || format === 'other') && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing, format])

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

  // Shiki highlighted HTML state
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')

  // Highlight code with shiki
  const highlightCode = useCallback(async (code: string, lang: string) => {
    if (!code) {
      setHighlightedHtml('')
      return
    }
    try {
      const highlighter = await getHighlighter()
      const html = highlighter.codeToHtml(code, {
        lang: lang as BundledLanguage,
        theme: 'one-dark-pro',
      })
      setHighlightedHtml(html)
    } catch {
      // Fallback to plain text if language not supported
      setHighlightedHtml(`<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
    }
  }, [])

  // Re-highlight when value or language changes
  useEffect(() => {
    if (format === 'yaml' || format === 'other') {
      highlightCode(value, language)
    }
  }, [value, language, format, highlightCode])

  // Code Preview component (for YAML and Other formats)
  const CodePreview = ({ isEmpty }: { isEmpty?: boolean }) => (
    <div
      className={`${classes.codePreview} ${isEmpty ? classes.previewEmpty : ''}`}
      style={{
        minHeight,
        maxHeight,
        overflow: maxHeight ? 'auto' : undefined,
      }}
    >
      {isEmpty ? (
        <em className={classes.placeholderText}>{placeholder}</em>
      ) : (
        <div
          className={classes.shikiWrapper}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      )}
    </div>
  )

  // YAML Editor component (simple textarea)
  const YamlEditor = () => (
    <div className={classes.yamlEditorWrapper}>
      <div className={classes.yamlEditorHeader}>
        <span className={classes.yamlBadge}>YAML</span>
      </div>
      <textarea
        ref={textareaRef}
        className={classes.yamlTextarea}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={{
          minHeight: minHeight - 40,
          maxHeight: maxHeight ? maxHeight - 40 : undefined,
        }}
      />
    </div>
  )

  // Other format Editor (simple textarea, no badge)
  const OtherEditor = () => (
    <div className={classes.otherEditorWrapper}>
      <textarea
        ref={textareaRef}
        className={classes.otherTextarea}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={{
          minHeight,
          maxHeight,
        }}
      />
    </div>
  )

  // Read-only mode
  if (readOnly) {
    if (format === 'yaml' || format === 'other') {
      return (
        <div className={`${classes.container} ${classes[accentColor]}`}>
          <CodePreview isEmpty={!value} />
        </div>
      )
    }

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
    if (format === 'yaml' || format === 'other') {
      return (
        <div
          ref={containerRef}
          className={`${classes.container} ${classes[accentColor]} ${classes.clickable}`}
          onClick={() => setIsEditing(true)}
        >
          <CodePreview isEmpty={!value} />
        </div>
      )
    }

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

  // Edit mode: YAML uses simple textarea, Markdown uses MDEditor
  if (format === 'yaml') {
    return (
      <div
        ref={inlineEdit ? containerRef : undefined}
        className={`${classes.container} ${classes[accentColor]}`}
      >
        <YamlEditor />
      </div>
    )
  }

  // Other format: plain textarea
  if (format === 'other') {
    return (
      <div
        ref={inlineEdit ? containerRef : undefined}
        className={`${classes.container} ${classes[accentColor]}`}
      >
        <OtherEditor />
      </div>
    )
  }

  // Markdown edit mode: full editor
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
