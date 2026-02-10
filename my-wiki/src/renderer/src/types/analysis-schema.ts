// Types for Character Analysis Schema System

export interface AnalysisSchemaFrontmatter {
  analysis_module: string
  target_character: string
  context_scope: string
  analysis_persona: string
  definitions?: Record<string, string>
  output_requirements?: {
    format: string
    language: string
    tone: string
  }
  schema_structure: Record<string, any>
}

export interface AnalysisSchema {
  id: string // filename without .md (e.g., "결핍")
  name: string // display name extracted from filename
  path: string // absolute file path
  frontmatter: AnalysisSchemaFrontmatter
  content: string // markdown content after frontmatter
  description?: string // extracted from content
}

export interface CharacterAnalysisTopic {
  id: string // unique identifier (uuid)
  characterId: string // wiki entry id
  schemaId: string // which schema was used (e.g., "결핍")
  schemaName: string // display name
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
  data: Record<string, any> // analysis results matching schema_structure
  sceneIds: string[] // scenes used in analysis
}
