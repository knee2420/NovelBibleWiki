import React, { memo } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import { User, Skull } from 'lucide-react' // Skull 아이콘 추가

// [타입 정의] 노드에 들어오는 데이터 구조
type CharacterNodeData = {
  label: string
  image?: string
  info?: {
    status?: string // "Active", "Deceased (사망)" 등
    affiliation?: string // "검무천가", "무소속" 등
    role?: string
    [key: string]: any
  }
}

export const CharacterNode = memo(({ data, selected }: NodeProps<Node<CharacterNodeData>>) => {
  const imageUrl = data.image
  const status = data.info?.status || ''
  const affiliation = data.info?.affiliation || ''

  // 1. 상태(Status) 분석 로직
  // "사망" 혹은 "Deceased" 텍스트가 포함되어 있으면 사망 처리
  const isDeceased = status.includes('사망') || status.toLowerCase().includes('deceased')

  // 2. 스타일 분기 처리
  // 사망: 흑백 필터 + 붉은/검정 테두리 + 낮은 투명도
  // 생존: 기존 스타일 (Cyan/Blue)
  const borderStyle = isDeceased
    ? 'border-red-900/60 shadow-[0_0_15px_rgba(127,29,29,0.4)]'
    : selected
      ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] scale-110'
      : 'border-slate-600 hover:border-cyan-500/50'

  const imageStyle = isDeceased ? 'grayscale opacity-70' : ''

  return (
    <div className="relative flex flex-col items-center group">
      {/* [Affiliation] 소속 배지 (머리 위) */}
      {affiliation && (
        <div
          className={`
          absolute -top-4 z-30 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-md whitespace-nowrap
          ${
            isDeceased
              ? 'bg-slate-800 border-red-900/30 text-slate-500' // 사망자는 소속도 어둡게
              : 'bg-slate-900 border-cyan-500/30 text-cyan-400'
          }
        `}
        >
          {affiliation}
        </div>
      )}

      {/* Main Circle Node */}
      <div
        className={`
          relative w-24 h-24 rounded-full border-4 transition-all duration-300
          bg-slate-900 flex items-center justify-center overflow-visible
          ${borderStyle}
        `}
      >
        {/* 이미지 영역 */}
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center relative z-10">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={data.label}
              className={`w-full h-full object-cover transition-all duration-500 ${imageStyle}`}
              draggable={false}
            />
          ) : // 이미지가 없을 때 아이콘
          isDeceased ? (
            <Skull className="text-red-900/50" size={40} />
          ) : (
            <User className="text-slate-600" size={40} />
          )}
        </div>

        {/* [Status Overlay] 사망 시 'DECEASED' 도장 찍기 (선택 사항) */}
        {isDeceased && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-red-600/80 border-2 border-red-600/80 px-1 transform -rotate-12 bg-black/40 backdrop-blur-[1px]">
              DECEASED
            </span>
          </div>
        )}

        {/* 연결점 (Handles) - 투명하게 배치 */}
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
        <Handle type="target" position={Position.Left} className="opacity-0" />
        <Handle type="source" position={Position.Right} className="opacity-0" />
      </div>

      {/* [Label] 이름표 (하단) */}
      <div
        className={`
        mt-2 px-3 py-1 rounded-md text-xs font-bold border transition-all duration-300 z-30
        ${
          isDeceased
            ? 'bg-slate-900/80 text-slate-500 border-slate-800 line-through decoration-red-900/50'
            : 'bg-slate-900/90 text-slate-200 border-slate-700 group-hover:border-cyan-500/50 group-hover:text-cyan-50'
        }
      `}
      >
        {data.label}
      </div>
    </div>
  )
})

CharacterNode.displayName = 'CharacterNode'
