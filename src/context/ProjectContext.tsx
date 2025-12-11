import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

const STORAGE_KEY = 'forgetful_selected_project'

interface ProjectContextValue {
  selectedProjectId: number | null
  setSelectedProject: (id: number | null) => void
  clearProject: () => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider')
  }
  return context
}

interface ProjectProviderProps {
  children: ReactNode
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored, 10) : null
  })

  useEffect(() => {
    if (selectedProjectId !== null) {
      localStorage.setItem(STORAGE_KEY, String(selectedProjectId))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [selectedProjectId])

  const setSelectedProject = useCallback((id: number | null) => {
    setSelectedProjectId(id)
  }, [])

  const clearProject = useCallback(() => {
    setSelectedProjectId(null)
  }, [])

  return (
    <ProjectContext.Provider value={{ selectedProjectId, setSelectedProject, clearProject }}>
      {children}
    </ProjectContext.Provider>
  )
}
