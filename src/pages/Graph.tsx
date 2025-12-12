import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import { Tooltip, ActionIcon, Menu } from '@mantine/core'
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
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useGraphData } from '@/hooks'
import { useProjectContext } from '@/context/ProjectContext'
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

export function Graph() {
  const navigate = useNavigate()
  const { selectedProjectId } = useProjectContext()
  const graphRef = useRef<ForceGraphMethods<GraphNodeData, GraphLinkData>>()

  const [isFullscreen, setIsFullscreen] = useState(false)
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

  // Filter graph data based on node filters
  const filteredData = useMemo(() => {
    if (!data) return { nodes: [], links: [] }

    const filteredNodes = data.nodes.filter(node => nodeFilters[node.type])
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
  }, [data, nodeFilters])

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

  const handleNodeClick = useCallback((node: GraphNodeData) => {
    setSelectedNode(node)

    // Navigate to detail page based on type
    const routes: Record<string, string> = {
      memory: '/memories',
      entity: '/entities',
      document: '/documents',
      code_artifact: '/code-artifacts',
      project: '/projects',
    }

    const baseRoute = routes[node.type]
    if (baseRoute) {
      const id = node.id.split('-')[1] // Extract numeric ID from "type-id" format
      navigate(`${baseRoute}/${id}`)
    }
  }, [navigate])

  const nodeCanvasObject = useCallback((node: GraphNodeData, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const x = node.x ?? 0
    const y = node.y ?? 0
    const size = 12
    const color = NODE_COLORS[node.type] || '#666'
    const isSelected = selectedNode?.id === node.id

    // Skip rendering if position not yet calculated
    if (node.x === undefined || node.y === undefined) return

    // Draw glow for selected node
    if (isSelected) {
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

    // Draw border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw label if zoomed in enough
    if (globalScale > 0.8) {
      ctx.font = `${10 / globalScale}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText(node.label, x, y + size + 4)
    }
  }, [selectedNode])

  // Empty state
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

        <div className={classes.toolbarGroup}>
          <Tooltip label="Search">
            <ActionIcon variant="subtle" color="gray">
              <IconSearch size={20} />
            </ActionIcon>
          </Tooltip>
          <Menu shadow="md" width={120}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDownload size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item>Export PNG</Menu.Item>
              <Menu.Item>Export SVG</Menu.Item>
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
        ) : (
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
            nodeId="id"
            linkSource="source"
            linkTarget="target"
            onEngineStop={() => setMinimapTick(t => t + 1)}
            onNodeDrag={() => setMinimapTick(t => t + 1)}
          />
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
