import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import * as d3 from 'd3-force'
import { Tooltip, ActionIcon, Menu, SegmentedControl, TextInput, Select, Badge } from '@mantine/core'
import {
  IconZoomIn,
  IconZoomOut,
  IconFocusCentered,
  IconBrain,
  IconBox,
  IconFileText,
  IconCode,
  IconFolder,
  IconSearch,
  IconDownload,
  IconMaximize,
  IconMinimize,
  IconHierarchy,
  IconCircleDot,
  IconVectorSpline,
  IconX,
} from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGraphData } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
import { useQuickEdit, type QuickEditItemType } from '@/context/QuickEditContext'
import type { GraphNode } from '@/api/graph'
import classes from './Graph.module.css'

const NODE_COLORS: Record<string, string> = {
  memory: '#a855f7',
  entity: '#f59e0b',
  document: '#3b82f6',
  code_artifact: '#06b6d4',
  project: '#22c55e',
}

const NODE_ICONS: Record<string, typeof IconBrain> = {
  memory: IconBrain,
  entity: IconBox,
  document: IconFileText,
  code_artifact: IconCode,
  project: IconFolder,
}

interface GraphNodeData extends GraphNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number
  fy?: number
}

interface GraphLinkData {
  id: string
  source: GraphNodeData | string
  target: GraphNodeData | string
  type: string
}

type LayoutType = 'force' | 'hierarchical' | 'radial'

export function Graph() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedProjectId } = useProjectContext()
  const { openPanel } = useQuickEdit()
  const graphRef = useRef<ForceGraphMethods<GraphNodeData, GraphLinkData>>()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layoutType, setLayoutType] = useState<LayoutType>('force')
  const [nodeFilters, setNodeFilters] = useState<Record<string, boolean>>({
    memory: true,
    entity: true,
    document: true,
    code_artifact: true,
    project: true,
  })
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [minimapTick, setMinimapTick] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Ego-centric graph state
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(
    searchParams.get('focus')
  )
  const [depth, setDepth] = useState<number>(2)
  const [searchQuery, setSearchQuery] = useState('')

  // Sync focusedNodeId with URL search params (for navigation from other pages)
  useEffect(() => {
    const focusParam = searchParams.get('focus')
    if (focusParam !== focusedNodeId) {
      setFocusedNodeId(focusParam)
    }
  }, [searchParams])

  const { data, isLoading } = useGraphData({
    projectId: selectedProjectId ?? undefined,
    includeEntities: true,
  })

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Get neighbors at N levels depth
  const getNeighborsAtDepth = useCallback((
    startNodeId: string,
    maxDepth: number,
    edges: typeof data.edges
  ): Set<string> => {
    const visited = new Set<string>([startNodeId])
    let currentLevel = new Set<string>([startNodeId])

    for (let d = 0; d < maxDepth; d++) {
      const nextLevel = new Set<string>()
      for (const nodeId of currentLevel) {
        for (const edge of edges) {
          const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as { id: string }).id
          const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as { id: string }).id

          if (sourceId === nodeId && !visited.has(targetId)) {
            nextLevel.add(targetId)
            visited.add(targetId)
          }
          if (targetId === nodeId && !visited.has(sourceId)) {
            nextLevel.add(sourceId)
            visited.add(sourceId)
          }
        }
      }
      currentLevel = nextLevel
    }

    return visited
  }, [])

  // Search results - filtered nodes matching query
  const searchResults = useMemo(() => {
    if (!data || !searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return data.nodes
      .filter(node => node.label.toLowerCase().includes(q))
      .slice(0, 10)
  }, [data, searchQuery])

  // Filter graph data based on focused node + depth + node type filters
  const filteredData = useMemo(() => {
    if (!data) return { nodes: [], links: [] }

    // If no focused node, show empty graph
    if (!focusedNodeId) {
      return { nodes: [], links: [] }
    }

    // Get all nodes within depth levels from focused node
    const visibleNodeIds = getNeighborsAtDepth(focusedNodeId, depth, data.edges)

    // Filter by both visible nodes and type filters
    const filteredNodes = data.nodes.filter(
      node => visibleNodeIds.has(node.id) && nodeFilters[node.type]
    )
    const nodeIds = new Set(filteredNodes.map(n => n.id))

    const filteredLinks = data.edges
      .filter(edge => {
        // Handle both string IDs and object nodes (after ForceGraph processes data)
        const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as { id: string }).id
        const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as { id: string }).id
        return nodeIds.has(sourceId) && nodeIds.has(targetId)
      })
      .map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      }))

    return { nodes: filteredNodes, links: filteredLinks }
  }, [data, nodeFilters, focusedNodeId, depth, getNeighborsAtDepth])

  const handleZoomIn = useCallback(() => {
    graphRef.current?.zoom(1.5, 400)
  }, [])

  const handleZoomOut = useCallback(() => {
    graphRef.current?.zoom(0.67, 400)
  }, [])

  const handleFitToView = useCallback(() => {
    graphRef.current?.zoomToFit(400, 50)
  }, [])

  const toggleFilter = useCallback((type: string) => {
    setNodeFilters(prev => ({ ...prev, [type]: !prev[type] }))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Export functions
  const exportToPNG = useCallback(() => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `knowledge-graph-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const exportToSVG = useCallback(() => {
    const nodesWithPos = filteredData.nodes.filter(
      (n): n is GraphNodeData & { x: number; y: number } =>
        (n as GraphNodeData).x !== undefined && (n as GraphNodeData).y !== undefined
    )

    if (nodesWithPos.length === 0) return

    const xs = nodesWithPos.map(n => n.x)
    const ys = nodesWithPos.map(n => n.y)
    const minX = Math.min(...xs) - 50
    const maxX = Math.max(...xs) + 50
    const minY = Math.min(...ys) - 50
    const maxY = Math.max(...ys) + 50

    const width = maxX - minX
    const height = maxY - minY

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">`
    svg += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#0f172a"/>`

    // Draw links
    filteredData.links.forEach(link => {
      const source = typeof link.source === 'string'
        ? nodesWithPos.find(n => n.id === link.source)
        : link.source as GraphNodeData
      const target = typeof link.target === 'string'
        ? nodesWithPos.find(n => n.id === link.target)
        : link.target as GraphNodeData

      if (source?.x !== undefined && source?.y !== undefined &&
          target?.x !== undefined && target?.y !== undefined) {
        svg += `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>`
      }
    })

    // Draw nodes
    nodesWithPos.forEach(node => {
      const color = NODE_COLORS[node.type] || '#666'
      svg += `<circle cx="${node.x}" cy="${node.y}" r="12" fill="${color}"/>`
      svg += `<text x="${node.x}" y="${node.y + 22}" text-anchor="middle" fill="white" font-size="10" font-family="system-ui">${node.label}</text>`
    })

    svg += '</svg>'

    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.download = `knowledge-graph-${Date.now()}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }, [filteredData])

  // Apply layout based on layoutType
  const applyLayout = useCallback(() => {
    if (!graphRef.current || !filteredData.nodes.length) return

    const nodes = filteredData.nodes as GraphNodeData[]
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2

    if (layoutType === 'hierarchical') {
      // Group nodes by type for hierarchical layout
      const typeOrder = ['project', 'document', 'memory', 'entity', 'code_artifact']
      const nodesByType: Record<string, GraphNodeData[]> = {}

      nodes.forEach(node => {
        if (!nodesByType[node.type]) nodesByType[node.type] = []
        nodesByType[node.type].push(node)
      })

      let y = 50
      typeOrder.forEach(type => {
        const typeNodes = nodesByType[type] || []
        const spacing = dimensions.width / (typeNodes.length + 1)
        typeNodes.forEach((node, i) => {
          node.fx = spacing * (i + 1)
          node.fy = y
        })
        if (typeNodes.length > 0) y += 120
      })

      graphRef.current.d3ReheatSimulation()
    } else if (layoutType === 'radial') {
      // Radial layout - place nodes in concentric circles by type
      const typeOrder = ['memory', 'entity', 'document', 'code_artifact', 'project']
      const nodesByType: Record<string, GraphNodeData[]> = {}

      nodes.forEach(node => {
        if (!nodesByType[node.type]) nodesByType[node.type] = []
        nodesByType[node.type].push(node)
      })

      let radius = 80
      typeOrder.forEach(type => {
        const typeNodes = nodesByType[type] || []
        if (typeNodes.length === 0) return

        const angleStep = (2 * Math.PI) / typeNodes.length
        typeNodes.forEach((node, i) => {
          node.fx = centerX + radius * Math.cos(angleStep * i - Math.PI / 2)
          node.fy = centerY + radius * Math.sin(angleStep * i - Math.PI / 2)
        })
        radius += 100
      })

      graphRef.current.d3ReheatSimulation()
    } else {
      // Force layout - release all fixed positions
      nodes.forEach(node => {
        node.fx = undefined
        node.fy = undefined
      })
      graphRef.current.d3ReheatSimulation()
    }
  }, [layoutType, filteredData.nodes, dimensions])

  // Apply layout when layout type changes
  useEffect(() => {
    applyLayout()
  }, [layoutType, applyLayout])

  // Настройка сил графа для разреженного отображения
  useEffect(() => {
    if (!graphRef.current) return

    const fg = graphRef.current
    // Отталкивание - сильнее для разреженности
    fg.d3Force('charge')?.strength(-200)
    // Связи значительно дальше друг от друга
    fg.d3Force('link')?.distance(200).strength(0.2)
    // Коллизия - увеличенное минимальное расстояние между узлами
    fg.d3Force('collision', d3.forceCollide(50).strength(1))
    // Перезапустить симуляцию
    fg.d3ReheatSimulation()
  }, [filteredData])

  // Focus on a specific node (ego-centric view)
  const focusOnNode = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId)
    setSearchParams({ focus: nodeId })
    setSearchQuery('')
  }, [setSearchParams])

  // Clear focus
  const clearFocus = useCallback(() => {
    setFocusedNodeId(null)
    setSearchParams({})
    setSelectedNode(null)
  }, [setSearchParams])

  const handleNodeClick = useCallback((node: GraphNodeData) => {
    setSelectedNode(node)

    // If clicking on a different node than the focused one, refocus on it
    if (node.id !== focusedNodeId) {
      focusOnNode(node.id)
    }

    // Extract numeric ID - try from data.id first, then parse from string id
    const numericId = (node.data?.id as number) ?? parseInt(node.id.split('-')[1] || node.id, 10)

    if (!isNaN(numericId)) {
      openPanel({
        type: node.type as QuickEditItemType,
        id: numericId,
      })
    }
  }, [openPanel, focusedNodeId, focusOnNode])

  const nodeCanvasObject = useCallback((node: GraphNodeData, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const x = node.x ?? 0
    const y = node.y ?? 0
    const color = NODE_COLORS[node.type] || '#666'
    const isSelected = selectedNode?.id === node.id
    const isFocused = node.id === focusedNodeId

    // Focused node is larger
    const size = isFocused ? 18 : 12

    // Skip rendering if position not yet calculated
    if (node.x === undefined || node.y === undefined) return

    // Draw outer glow for focused node (strongest highlight)
    if (isFocused) {
      // Outer pulsing ring
      ctx.beginPath()
      ctx.arc(x, y, size + 12, 0, 2 * Math.PI)
      ctx.fillStyle = `${color}22`
      ctx.fill()

      // Inner glow
      ctx.beginPath()
      ctx.arc(x, y, size + 6, 0, 2 * Math.PI)
      ctx.fillStyle = `${color}44`
      ctx.fill()
    }
    // Draw glow for selected node (but not focused)
    else if (isSelected) {
      ctx.beginPath()
      ctx.arc(x, y, size + 6, 0, 2 * Math.PI)
      ctx.fillStyle = `${color}66`
      ctx.fill()
    }

    // Draw node circle with gradient
    const gradient = ctx.createRadialGradient(
      x - size / 3, y - size / 3, 0,
      x, y, size
    )
    gradient.addColorStop(0, `${color}ff`)
    gradient.addColorStop(1, `${color}aa`)

    ctx.beginPath()
    ctx.arc(x, y, size, 0, 2 * Math.PI)
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw border - thicker and brighter for focused node
    if (isFocused) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.lineWidth = 3
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
    }
    ctx.stroke()

    // Draw label - always show for focused node, otherwise only when zoomed
    if (isFocused || globalScale > 0.8) {
      ctx.font = `${(isFocused ? 12 : 10) / globalScale}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = isFocused ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.9)'
      ctx.fillText(node.label, x, y + size + 4)
    }
  }, [selectedNode, focusedNodeId])

  // Empty state - no data at all
  if (!isLoading && (!data || data.nodes.length === 0)) {
    return (
      <div className={classes.container}>
        <div className={classes.emptyState}>
          <div className={classes.emptyIllustration}>
            <IconBrain size={64} stroke={1} />
          </div>
          <h2 className={classes.emptyTitle}>Your knowledge graph is empty</h2>
          <p className={classes.emptySubtext}>
            Create memories and entities to see connections
          </p>
          <button
            className={classes.emptyButton}
            onClick={() => navigate('/memories?create=true')}
          >
            Create First Memory
          </button>
          <button
            className={classes.emptyButtonGhost}
            onClick={() => navigate('/memories')}
          >
            Import Data
          </button>
        </div>
      </div>
    )
  }

  // Get focused node label for display
  const focusedNode = focusedNodeId ? data?.nodes.find(n => n.id === focusedNodeId) : null

  return (
    <div className={classes.container} ref={containerRef}>
      {/* Toolbar */}
      <div className={classes.toolbar}>
        <div className={classes.toolbarGroup}>
          <Tooltip label="Zoom In">
            <ActionIcon variant="subtle" color="gray" onClick={handleZoomIn}>
              <IconZoomIn size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Zoom Out">
            <ActionIcon variant="subtle" color="gray" onClick={handleZoomOut}>
              <IconZoomOut size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Fit to View">
            <ActionIcon variant="subtle" color="gray" onClick={handleFitToView}>
              <IconFocusCentered size={20} />
            </ActionIcon>
          </Tooltip>
        </div>

        <div className={classes.toolbarDivider} />

        {/* Layout Switcher */}
        <SegmentedControl
          size="xs"
          value={layoutType}
          onChange={(value) => setLayoutType(value as LayoutType)}
          className={classes.layoutSwitcher}
          data={[
            { value: 'force', label: <Tooltip label="Force Layout"><IconVectorSpline size={16} /></Tooltip> },
            { value: 'hierarchical', label: <Tooltip label="Hierarchical"><IconHierarchy size={16} /></Tooltip> },
            { value: 'radial', label: <Tooltip label="Radial"><IconCircleDot size={16} /></Tooltip> },
          ]}
        />

        <div className={classes.toolbarDivider} />

        <div className={classes.toolbarGroup}>
          {Object.entries(NODE_ICONS).map(([type, Icon]) => (
            <Tooltip key={type} label={type.replace('_', ' ')}>
              <ActionIcon
                variant="subtle"
                color={nodeFilters[type] ? 'gray' : 'dark'}
                onClick={() => toggleFilter(type)}
                style={{
                  color: nodeFilters[type] ? NODE_COLORS[type] : 'var(--text-dimmed)',
                }}
              >
                <Icon size={20} />
              </ActionIcon>
            </Tooltip>
          ))}
        </div>

        <div className={classes.toolbarDivider} />

        {/* Ego-centric controls: Search + Depth */}
        <div className={classes.toolbarGroup}>
          <div style={{ position: 'relative' }}>
            <TextInput
              placeholder="Search nodes..."
              size="xs"
              leftSection={<IconSearch size={14} />}
              rightSection={searchQuery ? (
                <ActionIcon size="xs" variant="subtle" onClick={() => setSearchQuery('')}>
                  <IconX size={12} />
                </ActionIcon>
              ) : null}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 180 }}
            />
            {searchResults.length > 0 && (
              <div className={classes.searchDropdown}>
                {searchResults.map(node => (
                  <div
                    key={node.id}
                    className={classes.searchResult}
                    onClick={() => focusOnNode(node.id)}
                  >
                    <span
                      className={classes.searchResultDot}
                      style={{ backgroundColor: NODE_COLORS[node.type] }}
                    />
                    <span className={classes.searchResultLabel}>{node.label}</span>
                    <Badge size="xs" variant="light" color="gray">
                      {node.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Select
            size="xs"
            value={String(depth)}
            onChange={(val) => setDepth(Number(val) || 2)}
            data={[
              { value: '1', label: 'Depth 1' },
              { value: '2', label: 'Depth 2' },
              { value: '3', label: 'Depth 3' },
            ]}
            style={{ width: 100 }}
            disabled={!focusedNodeId}
          />

          {focusedNodeId && (
            <Tooltip label="Clear focus">
              <ActionIcon variant="subtle" color="red" onClick={clearFocus}>
                <IconX size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </div>

        <div className={classes.toolbarDivider} />

        <div className={classes.toolbarGroup}>
          <Menu shadow="md" width={120}>
            <Menu.Target>
              <Tooltip label="Export">
                <ActionIcon variant="subtle" color="gray">
                  <IconDownload size={20} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={exportToPNG}>Export PNG</Menu.Item>
              <Menu.Item onClick={exportToSVG}>Export SVG</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Tooltip label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <ActionIcon variant="subtle" color="gray" onClick={toggleFullscreen}>
              {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
            </ActionIcon>
          </Tooltip>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className={classes.canvas}>
        {isLoading ? (
          <div className={classes.loading}>Loading graph...</div>
        ) : !focusedNodeId ? (
          <div className={classes.noFocusState}>
            <IconSearch size={48} stroke={1.5} style={{ opacity: 0.5 }} />
            <p className={classes.noFocusText}>
              Search for a memory or entity to explore its connections
            </p>
            <p className={classes.noFocusHint}>
              {data?.nodes.length ?? 0} nodes available
            </p>
          </div>
        ) : (
          <>
            {focusedNode && (
              <div className={classes.focusedLabel}>
                <Badge
                  size="lg"
                  variant="light"
                  color={NODE_COLORS[focusedNode.type]?.replace('#', '')}
                  leftSection={
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: NODE_COLORS[focusedNode.type],
                      }}
                    />
                  }
                >
                  {focusedNode.label}
                </Badge>
                <span className={classes.focusedStats}>
                  {filteredData.nodes.length} nodes · {filteredData.links.length} connections
                </span>
              </div>
            )}
            <ForceGraph2D
              ref={graphRef}
              graphData={filteredData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="transparent"
              nodeCanvasObject={nodeCanvasObject}
              linkColor={() => 'rgba(255,255,255,0.4)'}
              linkWidth={2}
              onNodeClick={handleNodeClick}
              onNodeDragEnd={node => {
                node.fx = node.x
                node.fy = node.y
              }}
              onBackgroundClick={() => setSelectedNode(null)}
              cooldownTicks={100}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              linkDistance={120}
              nodeId="id"
              linkSource="source"
              linkTarget="target"
              onEngineStop={() => setMinimapTick(t => t + 1)}
              onNodeDrag={() => setMinimapTick(t => t + 1)}
            />
          </>
        )}
      </div>

      {/* Legend */}
      <div className={classes.legend}>
        <div className={classes.legendTitle}>Node Types</div>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className={classes.legendItem}>
            <span className={classes.legendDot} style={{ backgroundColor: color }} />
            <span className={classes.legendLabel}>
              {type === 'code_artifact' ? 'Code Artifacts' : type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </div>
        ))}
        <div className={classes.legendDivider} />
        <div className={classes.legendFooter}>
          <span className={classes.legendLabel}>Edge Thickness</span>
          <span className={classes.legendHint}>= Relationship Strength</span>
        </div>
      </div>

      {/* Minimap */}
      <div
        className={classes.minimap}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const clickX = (e.clientX - rect.left) / rect.width
          const clickY = (e.clientY - rect.top) / rect.height

          // Calculate bounds from node positions
          const nodesWithPos = filteredData.nodes.filter(
            (n): n is GraphNodeData & { x: number; y: number } =>
              (n as GraphNodeData).x !== undefined && (n as GraphNodeData).y !== undefined
          )

          if (nodesWithPos.length === 0) return

          const xs = nodesWithPos.map(n => n.x)
          const ys = nodesWithPos.map(n => n.y)
          const minX = Math.min(...xs)
          const maxX = Math.max(...xs)
          const minY = Math.min(...ys)
          const maxY = Math.max(...ys)
          const rangeX = maxX - minX || 1
          const rangeY = maxY - minY || 1

          // Convert click position (0-1) to graph coordinates
          // Account for 5% padding on each side (so usable range is 5%-95%)
          const normalizedX = (clickX - 0.05) / 0.9
          const normalizedY = (clickY - 0.05) / 0.9
          const targetX = minX + normalizedX * rangeX
          const targetY = minY + normalizedY * rangeY

          graphRef.current?.centerAt(targetX, targetY, 300)
        }}
      >
        <div className={classes.minimapContent} key={minimapTick}>
          {(() => {
            // Calculate bounds from actual node positions
            const nodesWithPos = filteredData.nodes.filter(
              (n): n is GraphNodeData & { x: number; y: number } =>
                (n as GraphNodeData).x !== undefined && (n as GraphNodeData).y !== undefined
            )

            if (nodesWithPos.length === 0) return null

            const xs = nodesWithPos.map(n => n.x)
            const ys = nodesWithPos.map(n => n.y)
            const minX = Math.min(...xs)
            const maxX = Math.max(...xs)
            const minY = Math.min(...ys)
            const maxY = Math.max(...ys)
            const rangeX = maxX - minX || 1
            const rangeY = maxY - minY || 1

            return nodesWithPos.slice(0, 100).map(node => (
              <span
                key={node.id}
                className={classes.minimapDot}
                style={{
                  backgroundColor: NODE_COLORS[node.type],
                  left: `${((node.x - minX) / rangeX) * 90 + 5}%`,
                  top: `${((node.y - minY) / rangeY) * 90 + 5}%`,
                }}
              />
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
