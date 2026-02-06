export type CharacterStatus = 'ALIVE' | 'DECEASED' | 'INJURED' | 'STUNNED' | 'UNKNOWN' | 'ILLUSION';

export type RelationMood = 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL';

export type RelationTense = 'CURRENT' | 'PAST';

export interface SceneRelation {
  source: string;
  name: string;
  display?: string;
  mood?: RelationMood;
  tense?: RelationTense;
}

export interface CharacterUpdate {
  name: string;
  changes: {
    status?: CharacterStatus;
    role?: string;
    affiliation?: string;
    mental?: string;
    action?: string;
    [key: string]: any; // For flexibility
  };
}

export interface SceneDelta {
  appear?: string[];
  update?: CharacterUpdate[];
  relations?: SceneRelation[];
  disappear?: string[];
}

export interface SceneSchema {
  type: 'scene';
  chapter: number;
  scene: number;
  title: string;
  summary: string;
  characters: string[];
  locations: string[];
  tags: string[];
  'wiki-data': SceneDelta;
}
