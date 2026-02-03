import { memo } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import { User, Skull } from 'lucide-react' // Skull 아이콘 추가
import { CharacterGrade } from '../../types/wiki'

// [타입 정의] 노드에 들어오는 데이터 구조
type CharacterNodeData = {
  label: string
  image?: string
  info?: {
    status?: string // "Active", "Deceased (사망)" 등
    affiliation?: string // "검무천가", "무소속" 등
    grade?: CharacterGrade
    role?: string
    [key: string]: any
  }
}

const SIZE_MAP: Record<string, string> = {
  MAIN: 'w-32 h-32 border-[5px] text-lg', // 주연: 아주 큼
  SUB: 'w-24 h-24 border-4 text-sm', // 조연: 기본
  MINOR: 'w-16 h-16 border-2 text-[10px]', // 단역: 작음
  EXTRA: 'w-10 h-10 border text-[8px]', // 엑스트라: 아주 작음
  DEFAULT: 'w-24 h-24 border-4 text-sm'
}

export const CharacterNode = memo(({ data, selected }: NodeProps<Node<CharacterNodeData>>) => {
  const imageUrl = data.image
  const status = data.info?.status || ''
  const affiliation = data.info?.affiliation || ''

  const grade = data.info?.grade || 'SUB'
  const sizeClass = SIZE_MAP[grade] || SIZE_MAP.DEFAULT
  const isDeceased = status.includes('사망') || status.toLowerCase().includes('deceased')

  let borderStyle = 'border-slate-600 hover:border-cyan-500/50'

  if (isDeceased) {
    borderStyle = 'border-red-900/60 shadow-[0_0_15px_rgba(127,29,29,0.4)]'
  } else if (selected) {
    borderStyle = 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] scale-110'
  } else if (grade === 'MAIN') {
    // [New] 주연은 평소에도 금색 계열로 강조
    borderStyle = 'border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
  }

  const imageStyle = isDeceased ? 'grayscale opacity-70' : ''

  return (
    <div className="relative flex flex-col items-center group">
      {affiliation && grade !== 'EXTRA' && (
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
          relative rounded-full transition-all duration-300
          bg-slate-900 flex items-center justify-center overflow-visible
          ${sizeClass} ${borderStyle}
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
            <Skull className="text-red-900/50" size={grade === 'MAIN' ? 48 : 24} />
          ) : (
            <User className="text-slate-600" size={grade === 'MAIN' ? 48 : 24} />
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
      {(grade !== 'EXTRA' || selected) && (
        <div
          className={`
        mt-2 px-3 py-1 rounded-md text-xs font-bold border transition-all duration-300 z-30
        ${
          isDeceased
            ? 'bg-slate-900/80 text-slate-500 border-slate-800 line-through decoration-red-900/50'
            : grade === 'MAIN'
              ? 'bg-amber-950/80 text-amber-200 border-amber-800'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 group-hover:border-cyan-500/50 group-hover:text-cyan-50'
        }
      `}
        >
          {data.label}
        </div>
      )}
    </div>
  )
})

CharacterNode.displayName = 'CharacterNode'
