
export interface CharacterRelation {
  name: string
  display?: string
  mood?: 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL'
  tense?: 'CURRENT' | 'PAST'
  source?: string
}

export interface CharacterFrontmatter {
  name: string
  type: 'character'
  relations?: CharacterRelation[]
  grade?: string
  status?: string
  alias?: string | string[]
  [key: string]: any
}

export interface CharacterUpdate {
  name: string;
  changes: {
    status?: string | 'ALIVE' | 'DECEASED' | 'INJURED' | 'STUNNED' | 'UNKNOWN' | 'ILLUSION';
    role?: string;
    affiliation?: string;
    mental?: string;
    action?: string;
    [key: string]: any; 
  };
}

export interface SceneRelation {
  source: string;
  name: string;
  display?: string;
  mood?: 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL';
  tense?: 'CURRENT' | 'PAST';
}

export interface SceneDelta {
  appear?: string[];
  update?: CharacterUpdate[];
  relations?: SceneRelation[];
  disappear?: string[];
}

export interface SceneSchema {
  type?: 'scene';
  chapter?: number;
  scene?: number;
  title?: string; 
  'wiki-data'?: SceneDelta;
  [key: string]: any; 
}
