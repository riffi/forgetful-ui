// =============================================================================
// ENUMS
// =============================================================================

export type EntityType = 'Organization' | 'Individual' | 'Team' | 'Device' | 'Other'

export type ProjectType =
  | 'personal'
  | 'work'
  | 'learning'
  | 'development'
  | 'infrastructure'
  | 'template'
  | 'product'
  | 'marketing'
  | 'finance'
  | 'documentation'
  | 'development-environment'
  | 'third-party-library'
  | 'open-source'

export type ProjectStatus = 'active' | 'archived' | 'completed'

// =============================================================================
// ENTITIES
// =============================================================================

export interface Memory {
  id: number
  title: string
  content: string
  context: string
  keywords: string[]
  tags: string[]
  importance: number
  is_obsolete: boolean
  obsolete_reason?: string
  superseded_by?: number
  obsoleted_at?: string
  created_at: string
  updated_at: string
  // Relations (IDs from API)
  project_ids?: number[]
  linked_memory_ids?: number[]
  document_ids?: number[]
  code_artifact_ids?: number[]
  // Populated relations (for convenience, may need manual population)
  projects?: Project[]
  linked_memories?: Memory[]
  documents?: Document[]
  code_artifacts?: CodeArtifact[]
}

export interface MemoryCreate {
  title: string
  content: string
  context: string
  keywords: string[]
  tags: string[]
  importance?: number
  project_id?: number
}

export interface MemoryUpdate {
  title?: string
  content?: string
  context?: string
  keywords?: string[]
  tags?: string[]
  importance?: number
  project_ids?: number[]
  is_obsolete?: boolean
}

export interface Project {
  id: number
  name: string
  description: string
  project_type: ProjectType
  status: ProjectStatus
  repo_name?: string
  notes?: string
  memory_count: number
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  description: string
  project_type: ProjectType
  status?: ProjectStatus
  repo_name?: string
  notes?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string
  project_type?: ProjectType
  status?: ProjectStatus
  repo_name?: string
  notes?: string
}

export interface Entity {
  id: number
  name: string
  entity_type: EntityType
  custom_type?: string
  notes?: string
  tags: string[]
  created_at: string
  updated_at: string
  // Relations
  projects?: Project[]
  outgoing_relationships?: EntityRelationship[]
  incoming_relationships?: EntityRelationship[]
}

export interface EntityCreate {
  name: string
  entity_type: EntityType
  custom_type?: string
  notes?: string
  tags?: string[]
}

export interface EntityUpdate {
  name?: string
  entity_type?: EntityType
  custom_type?: string
  notes?: string
  tags?: string[]
}

export interface EntityRelationship {
  id: number
  source_entity_id: number
  target_entity_id: number
  relationship_type: string
  strength?: number
  confidence?: number
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  // Populated on fetch
  source_entity?: Entity
  target_entity?: Entity
}

export interface EntityRelationshipCreate {
  source_entity_id: number
  target_entity_id: number
  relationship_type: string
  strength?: number
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface Document {
  id: number
  title: string
  description: string
  content: string
  document_type: string
  filename?: string
  size_bytes?: number
  tags: string[]
  project_id?: number
  created_at: string
  updated_at: string
  // Relations
  project?: Project
}

export interface DocumentCreate {
  title: string
  description: string
  content: string
  document_type?: string
  filename?: string
  tags?: string[]
  project_id?: number
}

export interface DocumentUpdate {
  title?: string
  description?: string
  content?: string
  document_type?: string
  tags?: string[]
  project_id?: number
}

export interface CodeArtifact {
  id: number
  title: string
  description: string
  code: string
  language: string
  tags: string[]
  project_id?: number
  created_at: string
  updated_at: string
  // Relations
  project?: Project
}

export interface CodeArtifactCreate {
  title: string
  description: string
  code: string
  language: string
  tags?: string[]
  project_id?: number
}

export interface CodeArtifactUpdate {
  title?: string
  description?: string
  code?: string
  language?: string
  tags?: string[]
  project_id?: number
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface MemoriesResponse {
  memories: Memory[]
  total: number
  limit: number
  offset: number
}

export interface EntitiesResponse {
  entities: Entity[]
  total: number
  limit: number
  offset: number
}

export interface ProjectsResponse {
  projects: Project[]
  total: number
  limit: number
  offset: number
}

export interface DocumentsResponse {
  documents: Document[]
  total: number
  limit: number
  offset: number
}

export interface CodeArtifactsResponse {
  code_artifacts: CodeArtifact[]
  total: number
  limit: number
  offset: number
}

// =============================================================================
// FILTERS
// =============================================================================

export interface MemoryFilters {
  search?: string
  importance_min?: number
  importance_max?: number
  tags?: string[]
  project_id?: number
  is_obsolete?: boolean
  limit?: number
  offset?: number
}

export interface EntityFilters {
  search?: string
  entity_type?: EntityType
  tags?: string[]
  project_id?: number
  limit?: number
  offset?: number
}

export interface ProjectFilters {
  search?: string
  project_type?: ProjectType
  status?: ProjectStatus
  limit?: number
  offset?: number
}

export interface DocumentFilters {
  search?: string
  document_type?: string
  project_id?: number
  tags?: string[]
  limit?: number
  offset?: number
}

export interface CodeArtifactFilters {
  search?: string
  language?: string
  project_id?: number
  tags?: string[]
  limit?: number
  offset?: number
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface DashboardStats {
  memories_count: number
  entities_count: number
  projects_count: number
  documents_count: number
  code_artifacts_count: number
  relations_count: number
}
