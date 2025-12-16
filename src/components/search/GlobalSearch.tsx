import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Modal,
  TextInput,
  Text,
  Badge,
  Loader,
  Group,
  Stack,
  Kbd,
  ScrollArea,
} from '@mantine/core'
import { useDebouncedValue, useHotkeys } from '@mantine/hooks'
import {
  IconSearch,
  IconBrain,
  IconCube,
  IconFile,
  IconCode,
  IconFolder,
} from '@tabler/icons-react'
import { useSearchMemories } from '@/hooks/queries/useMemories'
import { useSearchEntities } from '@/hooks/queries/useEntities'
import { useProjectContext } from '@/context/ProjectContext'
import { useSearch } from '@/context/SearchContext'
import type { Memory, Entity } from '@/types'
import classes from './GlobalSearch.module.css'

interface SearchResult {
  type: 'memory' | 'entity' | 'document' | 'code_artifact' | 'project'
  id: number
  title: string
  subtitle?: string
  relevance?: number
}

const typeConfig = {
  memory: { icon: IconBrain, color: 'var(--accent-memory)', label: 'Memories' },
  entity: { icon: IconCube, color: 'var(--accent-entity)', label: 'Entities' },
  document: { icon: IconFile, color: 'var(--accent-document)', label: 'Documents' },
  code_artifact: { icon: IconCode, color: 'var(--accent-code)', label: 'Code Artifacts' },
  project: { icon: IconFolder, color: 'var(--accent-project)', label: 'Projects' },
}

const typeToRoute: Record<string, string> = {
  memory: 'memories',
  entity: 'entities',
  document: 'documents',
  code_artifact: 'code-artifacts',
  project: 'projects',
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()
  const { isOpen: opened, openSearch, closeSearch } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 300)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const searchMemories = useSearchMemories()
  const searchEntities = useSearchEntities()

  // Keyboard shortcut to open (/ like GitHub, Slack, Notion)
  useHotkeys([
    ['/', (e) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
      e.preventDefault()
      openSearch()
    }],
  ])

  // Focus input when opened
  useEffect(() => {
    if (opened) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [opened])

  // Perform search when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      return
    }

    const performSearch = async () => {
      setIsSearching(true)
      const allResults: SearchResult[] = []

      try {
        // Search memories
        const memoriesResult = await searchMemories.mutateAsync({
          query: debouncedQuery,
          options: {
            context: debouncedQuery,
            k: 5,
            projectIds: selectedProjectId ? [selectedProjectId] : undefined,
          },
        })

        memoriesResult.memories?.forEach((m: Memory) => {
          allResults.push({
            type: 'memory',
            id: m.id,
            title: m.title,
            subtitle: m.content?.slice(0, 100),
            relevance: m.importance,
          })
        })

        // Search entities
        const entitiesResult = await searchEntities.mutateAsync({
          query: debouncedQuery,
          options: { limit: 5 },
        })

        entitiesResult?.entities?.forEach((e: Entity) => {
          allResults.push({
            type: 'entity',
            id: e.id,
            title: e.name,
            subtitle: e.entity_type,
          })
        })

        setResults(allResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedQuery, selectedProjectId])

  // Handle result selection - navigate to detail page
  const handleSelect = useCallback((result: SearchResult) => {
    closeSearch()
    const route = typeToRoute[result.type]
    navigate(`/${route}/${result.id}`)
  }, [navigate, closeSearch])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      closeSearch()
    }
  }, [results, selectedIndex, handleSelect, closeSearch])

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  // Calculate flat index for each result
  let flatIndex = 0
  const resultWithIndex = Object.entries(groupedResults).map(([type, items]) => ({
    type,
    items: items.map(item => ({ ...item, flatIndex: flatIndex++ })),
  }))

  return (
    <Modal
      opened={opened}
      onClose={closeSearch}
      size="lg"
      padding={0}
      withCloseButton={false}
      centered
      classNames={{
        content: classes.modalContent,
        body: classes.modalBody,
      }}
    >
      <div className={classes.searchHeader}>
        <IconSearch size={20} className={classes.searchIcon} />
        <TextInput
          ref={inputRef}
          placeholder="Search memories, entities, documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="unstyled"
          className={classes.searchInput}
        />
        {isSearching && <Loader size="sm" />}
        <Kbd className={classes.escHint}>ESC</Kbd>
      </div>

      {query && (
        <ScrollArea className={classes.resultsArea} mah={400}>
          {results.length === 0 && !isSearching && debouncedQuery.length >= 2 && (
            <div className={classes.noResults}>
              <Text c="dimmed">No results found for "{debouncedQuery}"</Text>
            </div>
          )}

          {resultWithIndex.map(({ type, items }) => {
            const config = typeConfig[type as keyof typeof typeConfig]
            const Icon = config.icon

            return (
              <div key={type} className={classes.resultGroup}>
                <div className={classes.groupHeader}>
                  <Icon size={14} style={{ color: config.color }} />
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                    {config.label}
                  </Text>
                  <Badge size="xs" variant="light" color="gray">
                    {items.length}
                  </Badge>
                </div>

                <Stack gap={2}>
                  {items.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      className={`${classes.resultItem} ${result.flatIndex === selectedIndex ? classes.resultItemSelected : ''}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(result.flatIndex)}
                    >
                      <div className={classes.resultContent}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {result.title}
                        </Text>
                        {result.subtitle && (
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {result.subtitle}
                          </Text>
                        )}
                      </div>
                      {result.relevance !== undefined && (
                        <Badge
                          size="xs"
                          color={result.relevance >= 9 ? 'red' : result.relevance >= 7 ? 'yellow' : 'gray'}
                        >
                          {result.relevance}
                        </Badge>
                      )}
                    </button>
                  ))}
                </Stack>
              </div>
            )
          })}
        </ScrollArea>
      )}

      {!query && (
        <div className={classes.hints}>
          <Group gap="xs">
            <Text size="xs" c="dimmed">Type to search</Text>
            <Text size="xs" c="dimmed">|</Text>
            <Text size="xs" c="dimmed">
              <Kbd size="xs">↑</Kbd> <Kbd size="xs">↓</Kbd> to navigate
            </Text>
            <Text size="xs" c="dimmed">|</Text>
            <Text size="xs" c="dimmed">
              <Kbd size="xs">Enter</Kbd> to select
            </Text>
          </Group>
        </div>
      )}
    </Modal>
  )
}
