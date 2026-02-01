import { WikiEntry, CharacterEntry } from '../types/wiki'
import { GraphNode, GraphEdge } from '../types/graph'

export const generateGraphFromWikiData = (entries: WikiEntry[]) => {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // 1. 캐릭터 타입만 필터링 (Type Guard 적용)
  const characters = entries.filter((e): e is CharacterEntry => e.type === 'character')

  // 2. 그리드 레이아웃 설정
  const COLUMNS = 5 // 한 줄에 5명씩
  const X_SPACING = 250 // 가로 간격
  const Y_SPACING = 300 // 세로 간격 (이미지/정보창 고려하여 늘림)

  characters.forEach((char, index) => {
    const col = index % COLUMNS
    const row = Math.floor(index / COLUMNS)

    nodes.push({
      id: char.id,
      type: 'character', // 추후 커스텀 노드('characterNode')로 교체 예정
      label: char.name, // [FIX] .title -> .name 수정
      image: char.image, // [FIX] 이미지 데이터 연동
      data: {
        label: char.name, // React Flow 호환용
        ...char // 원본 데이터 전체 보존 (info.role, info.affiliation 등 접근 가능)
      },
      position: {
        x: col * X_SPACING,
        y: row * Y_SPACING
      }
    })
  })

  return { nodes, edges }
}
