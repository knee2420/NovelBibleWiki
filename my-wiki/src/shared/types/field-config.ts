export type FieldType = 'text' | 'textarea' | 'array' | 'number' | 'select' | 'system' | 'json';

export interface SceneFieldConfig {
  key: string;
  label: string;
  type: FieldType;
  description?: string;
  options?: string[];   // For 'select' type
  isInternal?: boolean; // If true, handled differently in UI/Logic (e.g. filename, graph data)
  order?: number;
}

// Re-using the same structure for Characters for consistency
export interface CharacterFieldConfig extends SceneFieldConfig {
  isFilter?: boolean;       // Show in character filter list?
  isPrimary?: boolean;      // Is this the primary sub-label? (e.g. Role)
}

// --- DYNAMIC DEFAULT MIGRATION ---

export const DEFAULT_SCENE_FIELDS: SceneFieldConfig[] = [
  // Core Identity
  { key: 'title', label: 'Title', type: 'text', description: 'The title of the scene', order: 0, isInternal: true },
  { key: 'chapter', label: 'Chapter', type: 'number', description: 'Chapter number', order: 0.1, isInternal: true },
  { key: 'scene', label: 'Scene #', type: 'number', description: 'Scene number', order: 0.2, isInternal: true },
  { key: 'type', label: 'Type', type: 'text', description: 'content type', order: 0.3, isInternal: true },

  // Content Fields (Previously System)
  { key: 'summary', label: 'Summary', type: 'textarea', description: 'Comprehensive summary of the scene', order: 1 },
  { key: 'characters', label: 'Characters', type: 'array', description: 'List of characters appearing', order: 2 },
  { key: 'locations', label: 'Locations', type: 'array', description: 'List of locations', order: 3 },
  { key: 'tags', label: 'Tags', type: 'array', description: 'Keywords and tags', order: 4 },
  
  // Complex Data
  { key: 'wiki-data', label: 'Graph Data', type: 'json', description: 'Auto-generated graph data', order: 99, isInternal: true }
];

export const DEFAULT_CHARACTER_FIELDS: CharacterFieldConfig[] = [
  // Core Identity
  { key: 'name', label: 'Name', type: 'text', description: 'Character Name', order: 0, isInternal: true },
  
  // Identity Fields
  { key: 'role', label: 'Role/Job', type: 'text', description: 'Main role (e.g. Protagonist, Knight)', order: 1, isPrimary: true, isFilter: true },
  { key: 'grade', label: 'Grade', type: 'select', options: ['MAIN', 'SUB', 'MINOR', 'EXTRA'], description: 'Importance', order: 2, isFilter: true },
  { key: 'alias', label: 'Aliases', type: 'text', description: 'Comma separated aliases', order: 3 },
  
  // Social
  { key: 'affiliation', label: 'Affiliation', type: 'text', description: 'Organization or Group', order: 4, isFilter: true },
  { key: 'rank', label: 'Rank', type: 'text', description: 'Social Rank or Title', order: 5 },
  
  // State
  { key: 'status', label: 'Status', type: 'select', options: ['ALIVE', 'DECEASED', 'INJURED', 'STUNNED', 'UNKNOWN', 'ILLUSION'], description: 'Current State', order: 6, isFilter: true },
  
  // Meta
  { key: 'tags', label: 'Tags', type: 'array', description: 'Character traits', order: 7 },
  { key: 'image', label: 'Profile Image', type: 'text', description: 'Image URL', order: 8 },
  
  // Complex
  { key: 'relations', label: 'Relationships', type: 'json', description: 'Relationship Graph', order: 99, isInternal: true },
  { key: 'type', label: 'Type', type: 'text', description: 'Entity Type', order: 100, isInternal: true }
];
