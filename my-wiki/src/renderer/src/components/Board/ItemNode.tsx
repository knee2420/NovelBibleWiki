import React, { memo } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import { Sword, Shield, Zap, Package, Gem, Scroll } from 'lucide-react' // 아이콘 추가

// [타입 정의]
type ItemNodeData = {
  label: string
  image?: string
  info?: {
    category?: string // 무기, 방어구, 소모품, 아티팩트 등
    rank?: string // S급, 레전드, 유물 등
    owner?: string
    [key: string]: any
  }
}

// [HELPER] 카테고리 텍스트에 따라 적절한 아이콘 반환
const getIconByCategory = (category: string = '') => {
  const cat = category.toLowerCase()
  if (cat.includes('무기') || cat.includes('weapon')) return <Sword size={24} />
  if (cat.includes('방어') || cat.includes('armor') || cat.includes('장비'))
    return <Shield size={24} />
  if (
    cat.includes('장신구') ||
    cat.includes('accessory') ||
    cat.includes('반지') ||
    cat.includes('목걸이')
  )
    return <Gem size={24} />
  if (
    cat.includes('소모') ||
    cat.includes('consumable') ||
    cat.includes('포션') ||
    cat.includes('술')
  )
    return <Zap size={24} />
  if (cat.includes('책') || cat.includes('book') || cat.includes('스킬'))
    return <Scroll size={24} />
  return <Package size={24} /> // 기본값: 상자
}

export const ItemNode = memo(({ data, selected }: NodeProps<Node<ItemNodeData>>) => {
  const imageUrl = data.image
  const category = data.info?.category || 'Etc'
  const rank = data.info?.rank

  // [STYLE] 아이템 전용 스타일 (Violet/Purple 테마 - RPG 에픽 아이템 느낌)
  const borderStyle = selected
    ? 'border-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.6)] scale-110'
    : 'border-slate-600 hover:border-violet-500'

  const bgStyle = selected ? 'bg-slate-800' : 'bg-slate-900'

  return (
    <div className="relative flex flex-col items-center group">
      {/* [Rank Badge] 등급 표시 (상단, 존재할 경우만) */}
      {rank && (
        <div className="absolute -top-3 z-30 px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter uppercase bg-violet-900/90 text-violet-200 border border-violet-500/50 shadow-sm whitespace-nowrap">
          {rank}
        </div>
      )}

      {/* Main Node Body (세로형 카드 - 인벤토리 슬롯 느낌) */}
      <div
        className={`
          relative w-20 h-28 rounded-lg border-2 transition-all duration-300
          flex flex-col items-center justify-start overflow-hidden shadow-lg
          ${bgStyle} ${borderStyle}
        `}
      >
        {/* 1. 이미지/아이콘 영역 (상단 70%) */}
        <div className="w-full h-[70%] bg-slate-950 flex items-center justify-center relative overflow-hidden border-b border-slate-700">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={data.label}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              draggable={false}
            />
          ) : (
            // 이미지가 없으면 카테고리 아이콘 표시
            <div className="text-violet-500/50 group-hover:text-violet-400 transition-colors">
              {getIconByCategory(category)}
            </div>
          )}

          {/* 아이템 광택 효과 (Decoration) */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        {/* 2. 이름 및 카테고리 영역 (하단 30%) */}
        <div className="w-full h-[30%] flex flex-col items-center justify-center p-1 bg-slate-900/50">
          <span className="text-[10px] font-bold text-slate-200 text-center leading-tight line-clamp-2 w-full">
            {data.label}
          </span>
          <span className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide truncate max-w-full">
            {category.split(' ')[0]} {/* "무기 (단검)" -> "무기"만 표시 */}
          </span>
        </div>

        {/* 연결점 (Handles) - 투명하게 배치 */}
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </div>
    </div>
  )
})

ItemNode.displayName = 'ItemNode'
