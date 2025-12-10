import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard, Memories, MemoryDetail } from '@/pages'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/memories" element={<Memories />} />
        <Route path="/memories/:id" element={<MemoryDetail />} />
        <Route path="/entities" element={<PlaceholderPage title="Entities" />} />
        <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
        <Route path="/documents" element={<PlaceholderPage title="Documents" />} />
        <Route path="/code-artifacts" element={<PlaceholderPage title="Code Artifacts" />} />
        <Route path="/graph" element={<PlaceholderPage title="Knowledge Graph" />} />
      </Route>
    </Routes>
  )
}

// Temporary placeholder for pages not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>This page is coming soon...</p>
    </div>
  )
}

export default App
