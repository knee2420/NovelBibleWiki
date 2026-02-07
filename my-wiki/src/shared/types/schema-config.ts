
export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

export interface SchemaProperty {
  id: string; 
  key: string; 
  type: SchemaType;
  description?: string;
  nullable?: boolean;
  items?: SchemaProperty; 
  properties?: SchemaProperty[]; 
  enum?: string[];
}

export const DEFAULT_SCENE_SCHEMA: SchemaProperty = {
  id: 'root_scene',
  key: 'root',
  type: 'object',
  description: '장면 분석 스키마',
  properties: [
     { id: 'p_chapter', key: 'chapter', type: 'number', description: '챕터 번호 (숫자)', nullable: false },
     { id: 'p_scene', key: 'scene', type: 'number', description: '장면 번호 (숫자)', nullable: false },
     { id: 'p_title', key: 'title', type: 'string', description: '장면 제목', nullable: false },
     { id: 'p_summary', key: 'summary', type: 'string', description: '장면의 전체 줄거리 요약 (300자 내외)', nullable: false },
     { 
         id: 'p_chars', key: 'characters', type: 'array', description: '등장한 모든 캐릭터 이름 목록', 
         items: { id: 'p_chars_item', key: 'name', type: 'string', description: '캐릭터 이름' }
     },
     { 
         id: 'p_locs', key: 'locations', type: 'array', description: '장소 목록 (List of locations)', 
         items: { id: 'p_locs_item', key: 'name', type: 'string', description: '장소 이름' }
     },
     { 
         id: 'p_tags', key: 'tags', type: 'array', description: '키워드 및 태그 (Keywords and tags)', 
         items: { id: 'p_tags_item', key: 'tag', type: 'string', description: '태그' }
     },
     {
         id: 'p_wiki', key: 'wiki-data', type: 'object', description: '인물 관계도 그래프 생성을 위한 데이터 (Character Updates)',
         properties: [
             { 
                 id: 'p_wiki_appear', key: 'appear', type: 'array', description: '이 장면에 처음 등장한 인물 이름만 (e.g. ["John", "Jane"])',
                 items: { id: 'p_wiki_appear_item', key: 'name', type: 'string' }
             },
             {
                 id: 'p_wiki_update', key: 'update', type: 'array', description: '인물 상태 및 관계 업데이트',
                 items: {
                     id: 'p_wiki_update_item', key: 'update_obj', type: 'object',
                     properties: [
                         { id: 'p_wu_name', key: 'name', type: 'string', description: '대상 캐릭터 이름 (이름만 정확히, 괄호 금지)', nullable: false },
                         { 
                             id: 'p_wu_changes', key: 'changes', type: 'object', description: '변경된 속성 객체', nullable: false,
                             properties: [
                                 { 
                                     id: 'p_wuc_status', key: 'status', type: 'string', description: '상태 (ALIVE, DECEASED, INJURED...)',
                                     enum: ['ALIVE', 'DECEASED', 'INJURED', 'STUNNED', 'UNKNOWN', 'ILLUSION']
                                 },
                                 { id: 'p_wuc_role', key: 'role', type: 'string', description: '현재 역할/직업' },
                                 { id: 'p_wuc_aff', key: 'affiliation', type: 'string', description: '소속 (Organization or Group)' },
                                 { id: 'p_wuc_mental', key: 'mental', type: 'string', description: '심리 상태 (Mental State)' },
                                 { id: 'p_wuc_action', key: 'action', type: 'string', description: '주요 행동 (Main Action)' }
                             ]
                         }
                     ]
                 }
             },
             {
                 id: 'p_wiki_relations', key: 'relations', type: 'array', description: '인물 간 관계 변화',
                 items: {
                     id: 'p_wiki_rel_item', key: 'relation_obj', type: 'object',
                     properties: [
                         { id: 'p_wr_source', key: 'source', type: 'string', description: '주체 (Subject)', nullable: false },
                         { id: 'p_wr_name', key: 'name', type: 'string', description: '대상 (Target)', nullable: false },
                         { id: 'p_wr_display', key: 'display', type: 'string', description: '관계 설명 (Display Text)', nullable: false },
                         { 
                             id: 'p_wr_mood', key: 'mood', type: 'string', description: '관계 분위기 (FRIENDLY, HOSTILE, NEUTRAL)',
                             enum: ['FRIENDLY', 'HOSTILE', 'NEUTRAL']
                         },
                         { 
                             id: 'p_wr_tense', key: 'tense', type: 'string', description: '시점 (CURRENT, PAST)',
                             enum: ['CURRENT', 'PAST']
                         }
                     ]
                 }
             },
             { 
                 id: 'p_wiki_disappear', key: 'disappear', type: 'array', description: '퇴장/사망한 인물 (Disappeared Characters)',
                 items: { id: 'p_wiki_disappear_item', key: 'name', type: 'string' }
             }
         ]
     },
     {
        id: 'p_wiki_item', key: 'wiki-item-data', type: 'object', description: '아이템 상태 업데이트 데이터 (Item Updates)',
        properties: [
            {
                id: 'p_wi_appear', key: 'appear', type: 'array', description: '새로 등장/획득한 아이템',
                items: { id: 'p_wi_appear_item', key: 'name', type: 'string' }
            },
            {
                id: 'p_wi_update', key: 'update', type: 'array', description: '아이템 상태 변화',
                items: {
                    id: 'p_wi_update_item', key: 'update_obj', type: 'object',
                    properties: [
                        { id: 'p_wiu_name', key: 'name', type: 'string', description: '대상 아이템 이름', nullable: false },
                        {
                            id: 'p_wiu_changes', key: 'changes', type: 'object', description: '변경된 속성', nullable: false,
                            properties: [
                                { id: 'p_wiu_owner', key: 'owner', type: 'string', description: '현재 소유자 (Owner)' },
                                { id: 'p_wiu_status', key: 'status', type: 'string', description: '상태 (NORMAL, DAMAGED, LOST, DESTROYED)' },
                                { id: 'p_wiu_loc', key: 'location', type: 'string', description: '현재 위치' }
                            ]
                        }
                    ]
                }
            },
            {
                id: 'p_wi_disappear', key: 'disappear', type: 'array', description: '소실/파괴된 아이템',
                items: { id: 'p_wi_disappear_item', key: 'name', type: 'string' }
            }
        ]
     },
     {
        id: 'p_wiki_location', key: 'wiki-location-data', type: 'object', description: '장소 상태 업데이트 데이터 (Location Updates)',
        properties: [
            {
                id: 'p_wl_appear', key: 'appear', type: 'array', description: '새로 등장한 장소',
                items: { id: 'p_wl_appear_item', key: 'name', type: 'string' }
            },
            {
                id: 'p_wl_update', key: 'update', type: 'array', description: '장소 상태 변화',
                items: {
                    id: 'p_wl_update_item', key: 'update_obj', type: 'object',
                    properties: [
                        { id: 'p_wlu_name', key: 'name', type: 'string', description: '장소 이름', nullable: false },
                        {
                            id: 'p_wlu_changes', key: 'changes', type: 'object', description: '변경된 속성', nullable: false,
                            properties: [
                                { id: 'p_wlu_danger', key: 'dangerLevel', type: 'string', description: '위험도 변경' },
                                { id: 'p_wlu_status', key: 'status', type: 'string', description: '상태 (NORMAL, RUINED, OCCUPIED)' },
                                { id: 'p_wlu_occupant', key: 'occupant', type: 'string', description: '점령 세력/인물' }
                            ]
                        }
                    ]
                }
            }
        ]
     },
     {
        id: 'p_wiki_faction', key: 'wiki-faction-data', type: 'object', description: '세력 상태 업데이트 데이터 (Faction Updates)',
        properties: [
            {
                id: 'p_wf_appear', key: 'appear', type: 'array', description: '새로 언급/등장한 세력',
                items: { id: 'p_wf_appear_item', key: 'name', type: 'string' }
            },
            {
                id: 'p_wf_update', key: 'update', type: 'array', description: '세력 상태 변화 (지도자 교체, 멸망 등)',
                items: {
                    id: 'p_wf_update_item', key: 'update_obj', type: 'object',
                    properties: [
                        { id: 'p_wfu_name', key: 'name', type: 'string', description: '세력 이름 (정확히 이름만)', nullable: false },
                        {
                            id: 'p_wfu_changes', key: 'changes', type: 'object', description: '변경된 속성', nullable: false,
                            properties: [
                                { id: 'p_wfu_leader', key: 'leader', type: 'string', description: '지도자 (Leader)' },
                                { id: 'p_wfu_scale', key: 'scale', type: 'string', description: '규모 (Scale)' },
                                { id: 'p_wfu_status', key: 'status', type: 'string', description: '상태 (ACTIVE, DESTROYED, HIDING)' }
                            ]
                        },
                        {
                            id: 'p_wfu_rel', key: 'relations', type: 'array', description: '타 세력과의 관계 변화',
                            items: {
                                id: 'p_wfu_rel_item', key: 'relation', type: 'object',
                                properties: [
                                    { id: 'p_wfur_target', key: 'target', type: 'string', description: '대상 세력 이름', nullable: false },
                                    { id: 'p_wfur_type', key: 'type', type: 'string', description: '관계 (ALLY, ENEMY, TRUCE)', nullable: false }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
     }
  ]
}

export const DEFAULT_CHARACTER_SCHEMA: SchemaProperty = {
  id: 'root_character',
  key: 'root',
  type: 'object',
  description: '캐릭터 프로필 스키마',
  properties: [
      { id: 'c_name', key: 'name', type: 'string', description: '캐릭터 이름', nullable: false },
      { id: 'c_type', key: 'type', type: 'string', description: '데이터 타입 (Fixed: character)' },
      { id: 'c_role', key: 'role', type: 'string', description: '역할 (주인공, 조연, 악역 등)' },
      { 
          id: 'c_grade', key: 'grade', type: 'string', description: '비중 (MAIN, SUB, MINOR, EXTRA)',
          enum: ['MAIN', 'SUB', 'MINOR', 'EXTRA']
      },
      { id: 'c_alias', key: 'alias', type: 'string', description: '이명 / 별명' },
      { id: 'c_aff', key: 'affiliation', type: 'string', description: '소속 (가문, 조직 등)' },
      { id: 'c_rank', key: 'rank', type: 'string', description: '직위 / 계급' },
      { 
          id: 'c_status', key: 'status', type: 'string', description: '현재 상태 (ALIVE, DECEASED...)',
          enum: ['ALIVE', 'DECEASED', 'INJURED', 'STUNNED', 'UNKNOWN', 'ILLUSION']
      },
      { id: 'c_image', key: 'image', type: 'string', description: '프로필 이미지 경로' },
      { 
          id: 'c_tags', key: 'tags', type: 'array', description: '캐릭터 특징 태그',
          items: { id: 'c_tags_item', key: 'tag', type: 'string' }
      },
      {
          id: 'c_rel', key: 'relations', type: 'array', description: '인간 관계 목록',
          items: {
              id: 'c_rel_item', key: 'relation', type: 'object',
              properties: [
                  { id: 'cr_name', key: 'name', type: 'string', description: '대상 이름' },
                  { id: 'cr_display', key: 'display', type: 'string', description: '관계 설명 (e.g. Brother, Enemy)' },
                  { 
                      id: 'cr_mood', key: 'mood', type: 'string', description: '관계 분위기 (FRIENDLY, TRUST, FEAR...)',
                      enum: ['FRIENDLY', 'HOSTILE', 'NEUTRAL', 'TRUST', 'FEAR', 'LOVE']
                  },
                  { 
                      id: 'cr_tense', key: 'tense', type: 'string', description: '관계 시점 (CURRENT, PAST, FUTURE)',
                      enum: ['CURRENT', 'PAST', 'FUTURE']
                  },
                  { id: 'cr_type', key: 'type', type: 'string', description: '관계 유형 (Optional)' }
              ]
          }
      }
  ]
}

export const DEFAULT_ITEM_SCHEMA: SchemaProperty = {
  id: 'root_item',
  key: 'root',
  type: 'object',
  description: '아이템 정보 스키마',
  properties: [
      { id: 'i_name', key: 'name', type: 'string', description: '아이템 이름', nullable: false },
      { id: 'i_cat', key: 'category', type: 'string', description: '분류 (무기, 소모품, 아티팩트 등)' },
      { id: 'i_rank', key: 'rarity', type: 'string', description: '등급 (S급, 레전드, 일반 등)' },
      { id: 'i_owner', key: 'owner', type: 'string', description: '현재 소유자' },
      { id: 'i_desc', key: 'description', type: 'string', description: '아이템 설명' },
      { id: 'i_image', key: 'image', type: 'string', description: '아이템 이미지 경로' },
      { 
          id: 'i_tags', key: 'tags', type: 'array', description: '관련 태그',
          items: { id: 'i_tags_item', key: 'tag', type: 'string' }
      }
  ]
}

export const DEFAULT_LOCATION_SCHEMA: SchemaProperty = {
  id: 'root_location',
  key: 'root',
  type: 'object',
  description: '장소/지역 정보 스키마',
  properties: [
      { id: 'l_name', key: 'name', type: 'string', description: '장소 이름', nullable: false },
      { id: 'l_reg', key: 'region', type: 'string', description: '상위 지역/대륙' },
      { id: 'l_danger', key: 'dangerLevel', type: 'string', description: '위험도' },
      { id: 'l_desc', key: 'description', type: 'string', description: '지역 설명' },
      { id: 'l_image', key: 'image', type: 'string', description: '지역 이미지' },
      { 
          id: 'l_tags', key: 'tags', type: 'array', description: '관련 태그',
          items: { id: 'l_tags_item', key: 'tag', type: 'string' }
      }
  ]
}

export const DEFAULT_FACTION_SCHEMA: SchemaProperty = {
  id: 'root_faction',
  key: 'root',
  type: 'object',
  description: '세력/조직 정보 스키마',
  properties: [
      { id: 'f_name', key: 'name', type: 'string', description: '세력 이름', nullable: false },
      { id: 'f_leader', key: 'leader', type: 'string', description: '수장 / 대표자' },
      { id: 'f_scale', key: 'scale', type: 'string', description: '규모 (대형, 중형, 소형 등)' },
      { id: 'f_desc', key: 'description', type: 'string', description: '세력 설명' },
      { id: 'f_image', key: 'image', type: 'string', description: '세력 문장/심볼 이미지' },
      { 
          id: 'f_tags', key: 'tags', type: 'array', description: '관련 태그',
          items: { id: 'f_tags_item', key: 'tag', type: 'string' }
      }
  ]
}

// Keep Alias for backward comp
export const DEFAULT_ROOT_SCHEMA = DEFAULT_SCENE_SCHEMA;

export const DEFAULT_SCHEMAS = {
    scene: DEFAULT_SCENE_SCHEMA,
    character: DEFAULT_CHARACTER_SCHEMA,
    item: DEFAULT_ITEM_SCHEMA,
    location: DEFAULT_LOCATION_SCHEMA,
    faction: DEFAULT_FACTION_SCHEMA
}
