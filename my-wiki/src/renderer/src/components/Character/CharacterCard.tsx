import { CharacterEntry } from '../../types/wiki'
import { User } from 'lucide-react'

interface CharacterCardProps {
  data: CharacterEntry
  onClick: (id: string) => void
}

export const CharacterCard = ({ data, onClick }: CharacterCardProps) => {
  const typeSymbol = data.tags[0] ? data.tags[0].charAt(0) : '?'
  const info = data.info || {}

  // [Logic] Draft 판별
  const isDraft = data.id.includes('00_Draft') || data.tags?.includes('draft')

  return (
    <div
      onClick={() => onClick(data.id)}
      className="group relative cursor-pointer transition-all duration-300 hover:-translate-y-2"
    >
      {/* 비율 3:4, 배경색 및 테두리 변경 */}
      <div
        className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#1e232e] border-2 shadow-lg transition-all
        ${
          isDraft
            ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
            : 'border-[#2d3243] group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
        }`}
      >
        {/* 배경 장식 (그라데이션) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#252b3a] to-[#1e232e] opacity-100" />
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/20 to-transparent" />

        {/* [NEW] Draft Badge */}
        {isDraft && (
          <div className="absolute top-3 right-3 z-20 px-2 py-0.5 bg-amber-500/90 text-black text-[10px] font-bold rounded shadow-sm backdrop-blur-sm animate-pulse">
            NEW
          </div>
        )}

        {/* 왼쪽 상단 속성 배지 */}
        <div className="absolute top-3 left-3 z-10">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border shadow-md transition-colors
            ${
              isDraft
                ? 'border-amber-500/50 group-hover:bg-amber-950'
                : 'border-slate-600 group-hover:border-cyan-400 group-hover:bg-cyan-950'
            }`}
          >
            <span
              className={`text-xs font-bold ${isDraft ? 'text-amber-500' : 'text-slate-300 group-hover:text-cyan-300'}`}
            >
              {typeSymbol}
            </span>
          </div>
        </div>

        {/* 컨텐츠 영역: 이미지 확대 및 중앙 배치 */}
        <div className="absolute inset-0 flex flex-col items-center p-4">
          <div className="flex-1 flex items-center justify-center w-full relative mt-2">
            {/* 광원 효과 */}
            <div
              className={`absolute w-32 h-32 rounded-full blur-xl transition-all
              ${isDraft ? 'bg-amber-500/10 group-hover:bg-amber-500/20' : 'bg-cyan-500/10 group-hover:bg-cyan-500/20'}`}
            />

            {/* 이미지 프레임 (크기 확대: w-32 ~ w-36) */}
            <div
              className={`relative w-32 h-32 md:w-36 md:h-36 rounded-full border-4 overflow-hidden shadow-inner bg-slate-800 transition-colors
              ${isDraft ? 'border-amber-900/60 group-hover:border-amber-500/30' : 'border-[#373e4e] group-hover:border-cyan-500/30'}`}
            >
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-600">
                  <User size={40} />
                </div>
              )}
            </div>
          </div>

          {/* 하단 텍스트 영역 (구분선 추가) */}
          <div className="h-20 flex flex-col items-center justify-center w-full border-t border-slate-700/50 pt-2 mt-2">
            <h3
              className={`text-lg font-bold transition-colors text-center truncate w-full px-2
              ${isDraft ? 'text-amber-100 group-hover:text-amber-400' : 'text-slate-100 group-hover:text-cyan-400'}`}
            >
              {data.name}
            </h3>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1 text-center truncate w-full px-2 group-hover:text-slate-400">
              {info.alias || info.role || 'Unknown'}
            </p>
          </div>
        </div>

        {/* 호버 시 나타나는 빛나는 외곽선 효과 */}
        <div className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none" />
      </div>
    </div>
  )
}
