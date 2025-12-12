import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Memory, Entity, Document, CodeArtifact, Project } from '@/types'

export type QuickEditItemType = 'memory' | 'entity' | 'document' | 'code_artifact' | 'project'

export interface QuickEditItem {
  type: QuickEditItemType
  id: number
  data?: Memory | Entity | Document | CodeArtifact | Project
}

interface QuickEditContextValue {
  selectedItem: QuickEditItem | null
  isOpen: boolean
  openPanel: (item: QuickEditItem) => void
  closePanel: () => void
  updateItemData: (data: Memory | Entity | Document | CodeArtifact | Project) => void
}

const QuickEditContext = createContext<QuickEditContextValue | null>(null)

export function QuickEditProvider({ children }: { children: ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<QuickEditItem | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openPanel = useCallback((item: QuickEditItem) => {
    setSelectedItem(item)
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
    // Delay clearing item to allow animation
    setTimeout(() => setSelectedItem(null), 300)
  }, [])

  const updateItemData = useCallback((data: Memory | Entity | Document | CodeArtifact | Project) => {
    setSelectedItem(prev => prev ? { ...prev, data } : null)
  }, [])

  return (
    <QuickEditContext.Provider value={{ selectedItem, isOpen, openPanel, closePanel, updateItemData }}>
      {children}
    </QuickEditContext.Provider>
  )
}

export function useQuickEdit() {
  const context = useContext(QuickEditContext)
  if (!context) {
    throw new Error('useQuickEdit must be used within QuickEditProvider')
  }
  return context
}
