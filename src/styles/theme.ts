import { createTheme, MantineColorsTuple, CSSVariablesResolver } from '@mantine/core'

// Color palettes for Mantine (10 shades each)
const memoryPurple: MantineColorsTuple = [
  '#f5f0ff', '#e9deff', '#d4bcff', '#b894ff', '#a855f7', // [4] = purple-500
  '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#3b0764'
]

const entityAmber: MantineColorsTuple = [
  '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', // [4] = amber-500
  '#d97706', '#b45309', '#92400e', '#78350f', '#451a03'
]

const documentBlue: MantineColorsTuple = [
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#3b82f6', // [4] = blue-500
  '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'
]

const codeArtifactCyan: MantineColorsTuple = [
  '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#06b6d4', // [4] = cyan-500
  '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344'
]

const projectGreen: MantineColorsTuple = [
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#22c55e', // [4] = green-500
  '#16a34a', '#15803d', '#166534', '#14532d', '#052e16'
]

const graphPink: MantineColorsTuple = [
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#ec4899', // [4] = pink-500
  '#db2777', '#be185d', '#9d174d', '#831843', '#500724'
]

export const theme = createTheme({
  primaryColor: 'purple',
  colors: {
    purple: memoryPurple,
    amber: entityAmber,
    blue: documentBlue,
    cyan: codeArtifactCyan,
    green: projectGreen,
    pink: graphPink,
  },

  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif',
  },

  radius: {
    xs: '4px',
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
  },

  other: {
    // === Accent colors by type ===
    accentMemory: '#a855f7',       // purple-500
    accentEntity: '#f59e0b',       // amber-500
    accentDocument: '#3b82f6',     // blue-500
    accentCode: '#06b6d4',         // cyan-500
    accentProject: '#22c55e',      // green-500
    accentGraph: '#ec4899',        // pink-500

    // === Surfaces (glassmorphism) - from reference ===
    surfacePrimary: 'rgba(15, 23, 42, 0.8)',    // slate-900/80
    surfaceSecondary: 'rgba(30, 41, 59, 0.6)',  // slate-800/60
    surfaceHover: 'rgba(51, 65, 85, 0.4)',      // slate-700/40

    // === Text ===
    textPrimary: 'rgba(255, 255, 255, 0.9)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textDimmed: 'rgba(255, 255, 255, 0.4)',

    // === Borders ===
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderHover: 'rgba(255, 255, 255, 0.1)',

    // === Importance colors ===
    importanceHigh: 'linear-gradient(135deg, #ef4444, #f97316)',  // 9-10
    importanceMedium: '#eab308',  // 7-8
    importanceLow: '#6b7280',     // <7

    // === Backgrounds ===
    bgBase: '#020617',                   // slate-950
    bgSidebar: 'rgba(15, 23, 42, 0.95)', // slate-900/95
    bgGraph: '#020617',                  // slate-950

    // === Interactive states ===
    glowSelected: '0 0 20px rgba(168, 85, 247, 0.4)',
    glowMemory: '0 0 20px rgba(168, 85, 247, 0.2)',
    glowEntity: '0 0 20px rgba(245, 158, 11, 0.2)',
    glowProject: '0 0 20px rgba(34, 197, 94, 0.2)',
    glowDocument: '0 0 20px rgba(59, 130, 246, 0.2)',
    glowCode: '0 0 20px rgba(6, 182, 212, 0.2)',
    glowGraph: '0 0 20px rgba(236, 72, 153, 0.2)',
  },
})

// CSS variables for use in components
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {},
  light: {},
  dark: {
    // Surfaces
    '--surface-primary': theme.other.surfacePrimary,
    '--surface-secondary': theme.other.surfaceSecondary,
    '--surface-hover': theme.other.surfaceHover,
    // Text
    '--text-primary': theme.other.textPrimary,
    '--text-secondary': theme.other.textSecondary,
    '--text-dimmed': theme.other.textDimmed,
    // Borders
    '--border-subtle': theme.other.borderSubtle,
    '--border-hover': theme.other.borderHover,
    // Backgrounds
    '--bg-base': theme.other.bgBase,
    '--bg-sidebar': theme.other.bgSidebar,
    // Accent colors
    '--accent-memory': theme.other.accentMemory,
    '--accent-entity': theme.other.accentEntity,
    '--accent-document': theme.other.accentDocument,
    '--accent-code': theme.other.accentCode,
    '--accent-project': theme.other.accentProject,
    '--accent-graph': theme.other.accentGraph,
    // Importance
    '--importance-high': theme.other.importanceHigh,
    '--importance-medium': theme.other.importanceMedium,
    '--importance-low': theme.other.importanceLow,
    // Glows
    '--glow-selected': theme.other.glowSelected,
    '--glow-memory': theme.other.glowMemory,
    '--glow-entity': theme.other.glowEntity,
    '--glow-project': theme.other.glowProject,
    '--glow-document': theme.other.glowDocument,
    '--glow-code': theme.other.glowCode,
    '--glow-graph': theme.other.glowGraph,
  },
})
