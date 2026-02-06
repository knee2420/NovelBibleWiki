export interface CharacterRelation {
  name: string
  display?: string // Relation description (e.g. "Brother", "Enemy")
  mood?: 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL' | 'TRUST' | 'FEAR' | 'LOVE'
  tense?: 'CURRENT' | 'PAST' | 'FUTURE'
  type?: string // For items or special relations
}

export interface CharacterFrontmatter {
  name: string
  // [Identity]
  role: string // Short job title or role (e.g. "Protagonist", "Guild Master")
  grade?: 'MAIN' | 'SUB' | 'MINOR' | 'EXTRA'
  alias?: string // Comma separated aliases
  
  // [Social]
  affiliation?: string // Organization
  rank?: string // Military rank or social status
  
  // [State]
  status: 'ALIVE' | 'DECEASED' | 'INJURED' | 'STUNNED' | 'UNKNOWN' | 'ILLUSION'
  
  // [Meta]
  type: 'character'
  tags?: string[]
  image?: string
  
  // [Graph]
  relations: CharacterRelation[]
}

export interface CharacterStructure {
  frontmatter: CharacterFrontmatter
  markdownContent: string // The body content (logs)
}
