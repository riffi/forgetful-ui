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

export const theme = createTheme({
  primaryColor: 'purple',
  colors: {
    purple: memoryPurple,
    amber: entityAmber,
    blue: documentBlue,
    cyan: codeArtifactCyan,
    green: projectGreen,
  },

  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  },

  other: {
    // === Accent colors by type (from ui-spec palette) ===
    accentMemory: '#a855f7',      // purple-500
    accentEntity: '#f59e0b',      // amber-500
    accentDocument: '#3b82f6',    // blue-500
    accentCodeArtifact: '#06b6d4', // cyan-500
    accentProject: '#22c55e',      // green-500

    // === Surfaces (glassmorphism) ===
    surfacePrimary: 'rgba(30, 41, 59, 0.8)',    // bg-slate-900/80 + blur
    surfaceSecondary: 'rgba(51, 65, 85, 0.6)',  // bg-slate-800/60 + blur
    surfaceHover: 'rgba(71, 85, 105, 0.4)',     // bg-slate-700/40

    // === Text ===
    textPrimary: 'rgba(255, 255, 255, 0.9)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textDimmed: 'rgba(255, 255, 255, 0.4)',

    // === Borders ===
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderHover: 'rgba(255, 255, 255, 0.1)',

    // === Importance gradients ===
    importanceHigh: 'linear-gradient(135deg, #ef4444, #f97316)',  // 9-10
    importanceMedium: '#eab308',  // 7-8
    importanceLow: '#6b7280',     // <7

    // === Backgrounds ===
    bgBase: '#020617',            // slate-950
    bgSidebar: 'rgba(15, 23, 42, 0.95)', // slate-900/95
    bgGraph: '#020617',           // slate-950 (pure)

    // === Interactive states ===
    glowSelected: '0 0 20px rgba(168, 85, 247, 0.4)',
  },
})

// CSS variables for use in components
export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {},
  light: {},
  dark: {
    '--surface-primary': theme.other.surfacePrimary,
    '--surface-secondary': theme.other.surfaceSecondary,
    '--surface-hover': theme.other.surfaceHover,
    '--text-primary': theme.other.textPrimary,
    '--text-secondary': theme.other.textSecondary,
    '--text-dimmed': theme.other.textDimmed,
    '--border-subtle': theme.other.borderSubtle,
    '--border-hover': theme.other.borderHover,
    '--bg-base': theme.other.bgBase,
    '--bg-sidebar': theme.other.bgSidebar,
    '--accent-memory': theme.other.accentMemory,
    '--accent-entity': theme.other.accentEntity,
    '--accent-document': theme.other.accentDocument,
    '--accent-code-artifact': theme.other.accentCodeArtifact,
    '--accent-project': theme.other.accentProject,
  },
})
