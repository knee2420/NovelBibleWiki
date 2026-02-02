import React, { memo } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import { Landmark, Shield } from 'lucide-react' // 건물, 방패 아이콘

type FactionNodeData = {
  label: string
  image?: string
  info?: {
    leader?: string
    scale?: string
    [key: string]: any
  }
}

export const FactionNode = memo(({ data, selected }: NodeProps<Node<FactionNodeData>>) => {
  const imageUrl = data.image
  const leader = data.info?.leader

  // [STYLE] 세력 전용 스타일 (Amber/Gold 테마)
  const borderStyle = selected
    ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-110'
    : 'border-amber-700 hover:border-amber-500'

  return (
    <div className="relative flex flex-col items-center group">
      {/* [Leader Badge] 수장(Leader) 정보가 있다면 상단에 표시 */}
      {leader && (
        <div className="absolute -top-5 z-30 flex items-center gap-1 px-2 py-0.5 rounded-sm bg-black/80 border border-amber-500/50 text-[10px] text-amber-500 font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
          <span className="text-xs">👑</span> {leader}
        </div>
      )}

      {/* Main Node Body (마름모/사각 형태 - rotate-45로 마름모 연출 or rounded-xl로 둥근 사각) */}
      {/* 여기서는 가독성을 위해 '둥근 사각형(App Icon 스타일)'을 채택 */}
      <div
        className={`
          relative w-28 h-28 rounded-2xl border-[3px] transition-all duration-300
          bg-slate-900 flex items-center justify-center overflow-visible shadow-2xl
          ${borderStyle}
        `}
      >
        {/* 이미지 영역 */}
        <div className="w-full h-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center relative z-10">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={data.label}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              draggable={false}
            />
          ) : (
            // 이미지가 없으면 랜드마크(건물) 아이콘
            <Landmark className="text-amber-700/50" size={48} />
          )}
        </div>

        {/* 장식용 테두리 (이중선 효과) */}
        <div className="absolute inset-1 rounded-xl border border-amber-500/20 pointer-events-none z-20" />

        {/* 연결점 (Handles) */}
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
        <Handle type="target" position={Position.Left} className="opacity-0" />
        <Handle type="source" position={Position.Right} className="opacity-0" />
      </div>

      {/* [Label] 이름표 (하단, 세력은 좀 더 강조됨) */}
      <div
        className={`
        mt-3 px-4 py-1.5 rounded-sm text-sm font-black tracking-tight border transition-all duration-300 z-30
        bg-amber-950/80 text-amber-100 border-amber-800/50 group-hover:border-amber-500 group-hover:text-white
      `}
      >
        {data.label}
      </div>
    </div>
  )
})

FactionNode.displayName = 'FactionNode'
