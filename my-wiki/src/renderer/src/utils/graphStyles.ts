import { RelationMood, RelationTense } from '../types/wiki'

export const getEdgeStyle = (mood?: RelationMood, tense?: RelationTense) => {
  // 1. 색상 (Mood)
  let stroke = '#64748b' // Default (Neutral)
  if (mood === 'FRIENDLY') stroke = '#3b82f6' // Blue
  if (mood === 'HOSTILE') stroke = '#ef4444' // Red
  // TRUST는 FRIENDLY로 통합

  // 2. 선 스타일 (Tense)
  // PAST(과거)면 점선 + 투명도, CURRENT(현재)면 실선
  const strokeDasharray = tense === 'PAST' ? '5 5' : undefined
  const opacity = tense === 'PAST' ? 0.4 : 1
  const width = tense === 'CURRENT' ? 2 : 1.5

  return {
    style: { stroke, strokeWidth: width, strokeDasharray, opacity },
    labelStyle: { fill: stroke, fontWeight: 700, fontSize: 11 },
    markerColor: stroke
  }
}
