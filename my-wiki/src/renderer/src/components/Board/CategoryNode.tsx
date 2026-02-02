import { memo } from 'react' // React import 제거 (unused error 해결)
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import { Users, Package, Flag, Sparkles, ChevronRight } from 'lucide-react'

// [타입] 이 노드가 품고 있는 하위 데이터 목록
type CategoryNodeData = {
  label: string
  categoryType: string
  subItems: any[]
}

// 카테고리별 아이콘
const getIcon = (type: string) => {
  switch (type) {
    case 'relations':
      return <Users size={16} />
    case 'items':
      return <Package size={16} />
    case 'faction':
      return <Flag size={16} />
    case 'skills':
      return <Sparkles size={16} />
    default:
      return <ChevronRight size={16} />
  }
}

export const CategoryNode = memo(({ data, selected }: NodeProps<Node<CategoryNodeData>>) => {
  const icon = getIcon(data.categoryType)

  // [STYLE] 버튼 같은 디자인 (Glassmorphism)
  const borderStyle = selected
    ? 'border-white bg-slate-700 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
    : 'border-slate-600 bg-slate-800/80 hover:bg-slate-700 hover:border-cyan-400'

  return (
    <div className="relative flex flex-col items-center group cursor-pointer">
      <div
        className={`
          w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200
          backdrop-blur-sm shadow-lg ${borderStyle}
        `}
      >
        <div className="text-slate-200 group-hover:text-cyan-300 transition-colors">{icon}</div>

        {/* 연결점 (중앙 배치) - Position.Center가 없으므로 CSS로 강제 중앙 정렬 */}
        <Handle
          type="target"
          position={Position.Top}
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0 }}
        />
        <Handle
          type="source"
          position={Position.Top}
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0 }}
        />
      </div>

      {/* 라벨 (하단) */}
      <div className="absolute top-14 text-[10px] font-bold text-slate-400 bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap group-hover:text-white transition-colors">
        {data.label}
        <span className="ml-1 text-slate-500 text-[9px]">({data.subItems.length})</span>
      </div>
    </div>
  )
})

CategoryNode.displayName = 'CategoryNode'
