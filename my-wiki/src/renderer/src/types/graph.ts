export interface GraphNode {
  id: string
  type: 'character' | 'item' | 'location' | 'faction' | 'root' | 'default' | 'scene'
  label: string
  image?: string // 이미지 경로 (Base64 or URL)
  data?: any // 원본 WikiEntry 데이터 등을 담음

  // 위치 정보 (React Flow 호환)
  position: { x: number; y: number }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string // 관계명 (예: "친구", "소유")
  type?: 'default' | 'straight' | 'step' | 'smoothstep'
  animated?: boolean
}
