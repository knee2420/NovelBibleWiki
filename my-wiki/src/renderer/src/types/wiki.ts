export type EntryType = 'character' | 'item' | 'location' | 'faction' | 'other'

// 공통 속성
export interface BaseEntry {
  id: string          // 파일 경로 (ID)
  name: string        // 이름 (Frontmatter 'name' or 파일명)
  type: EntryType     // 데이터 타입
  image?: string      // 이미지 경로
  description: string // 요약 설명
  tags: string[]      // 태그
  content: string     // 본문 마크다운
}

// 1. 캐릭터 (기존 확장)
export interface CharacterEntry extends BaseEntry {
  type: 'character'
  info: {
    role?: string       // 역할 (주인공, 조연)
    affiliation?: string // 소속
    status?: string     // 상태 (생존, 사망)
    alias?: string      // 이명
  }
}

// 2. 아이템 (신규)
export interface ItemEntry extends BaseEntry {
  type: 'item'
  info: {
    category?: string   // 무기, 소모품, 아티팩트
    rarity?: string     // 등급 (S, A, B...)
    owner?: string      // 소유자
  }
}

// 3. 장소 (신규)
export interface LocationEntry extends BaseEntry {
  type: 'location'
  info: {
    region?: string     // 상위 지역 (예: 아프리카, 서울)
    dangerLevel?: string // 위험도
  }
}

// 4. 세력 (신규)
export interface FactionEntry extends BaseEntry {
  type: 'faction'
  info: {
    leader?: string     // 수장
    scale?: string      // 규모
  }
}

export type WikiEntry = CharacterEntry | ItemEntry | LocationEntry | FactionEntry
