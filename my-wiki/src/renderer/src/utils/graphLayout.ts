import { Node } from '@xyflow/react'
import { WikiEntry } from '../types/wiki'

/**
 * 중심 노드(centerNode)를 기준으로 count 개수만큼의 자식 노드들을
 * radius 거리의 원형으로 배치할 좌표를 반환합니다.
 */
export const getRadialPositions = (centerNode: Node, count: number, radius: number = 300) => {
  const positions: { x: number; y: number }[] = []
  // 12시 방향(-90도)부터 시작하여 시계방향으로 배치
  const startAngle = -Math.PI / 2
  const angleStep = (2 * Math.PI) / count

  for (let i = 0; i < count; i++) {
    const angle = startAngle + i * angleStep
    positions.push({
      x: centerNode.position.x + radius * Math.cos(angle),
      y: centerNode.position.y + radius * Math.sin(angle)
    })
  }
  return positions
}

export const findEntryByName = (name: string, allEntries: WikiEntry[]) => {
  return allEntries.find((entry) => entry.name === name || (entry.info as any).title === name)
}
