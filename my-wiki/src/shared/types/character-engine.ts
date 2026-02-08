export type GrowthCategory = string; // Was 'space' | 'bond' | 'power' | 'identity'

export interface GrowthNode {
  id: string;
  label: string; 
  category: GrowthCategory;
  act: number; // 등장 시점 (Act)
  levelRequirement?: number; 
  status: 'locked' | 'unlocked' | 'active' | 'discarded';
  description?: string;
  requirements?: string;
  relatedScenes?: string[];
  isChoice?: boolean; // 분기점 여부
}

export interface AxisLevel {
  current: number;
  max: number;
  label: string; // 예: "1Lv: 생존자"
}

export interface CharacterBlueprint {
  characterId: string; // wiki.json의 ID와 매핑
  axes: Record<string, AxisLevel>; // 4대 축 레벨 상태
  nodes: GrowthNode[]; // 성장 트리 노드
}

// Default Blueprint Template
export const DEFAULT_BLUEPRINT: CharacterBlueprint = {
    characterId: '',
    axes: {
        space: { current: 1, max: 5, label: '이동 범위' },
        bond: { current: 1, max: 5, label: '관계의 깊이' },
        power: { current: 1, max: 5, label: '힘의 크기' },
        identity: { current: 1, max: 5, label: '자아의 확립' }
    },
    nodes: []
};
