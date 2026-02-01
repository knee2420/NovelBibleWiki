import React, { memo } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import { User } from 'lucide-react'

// [FIX] Node의 data 구조를 정의합니다.
// graphTransformer에서 넣어주는 데이터 형태와 일치해야 합니다.
type CharacterNodeData = {
  label: string
  image?: string
}

// [FIX] NodeProps에 제네릭으로 우리가 정의한 데이터 타입을 넘겨줍니다.
// 이렇게 하면 props.data.label이 string임을 인식하게 됩니다.
export const CharacterNode = memo(({ data, selected }: NodeProps<Node<CharacterNodeData>>) => {
  const imageUrl = data.image

  return (
    <div
      className={`relative w-24 h-24 rounded-full border-4 transition-all duration-300 shadow-xl group ${
        selected
          ? 'border-blue-500 shadow-blue-500/50 scale-110'
          : 'border-slate-700 hover:border-slate-500'
      } bg-slate-800 flex items-center justify-center overflow-visible`}
    >
      {/* 1. 이미지 영역 */}
      <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center relative z-10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={data.label}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <User className="text-slate-600" size={40} />
        )}
      </div>

      {/* 2. 이름 라벨 */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-slate-900/80 px-3 py-1 rounded-full text-xs font-bold text-slate-200 pointer-events-none border border-slate-700 transition-opacity opacity-80 group-hover:opacity-100 z-20">
        {data.label}
      </div>

      {/* 3. 연결점 (Handles) */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
})

CharacterNode.displayName = 'CharacterNode'
