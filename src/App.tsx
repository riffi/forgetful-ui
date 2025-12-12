import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard, Memories, MemoryDetail, Entities, EntityDetail, Projects, ProjectDetail, Documents, DocumentDetail, CodeArtifacts, CodeArtifactDetail, Graph } from '@/pages'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/memories" element={<Memories />} />
        <Route path="/memories/:id" element={<MemoryDetail />} />
        <Route path="/entities" element={<Entities />} />
        <Route path="/entities/:id" element={<EntityDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/code-artifacts" element={<CodeArtifacts />} />
        <Route path="/code-artifacts/:id" element={<CodeArtifactDetail />} />
        <Route path="/graph" element={<Graph />} />
      </Route>
    </Routes>
  )
}

export default App
