import React, { useState } from 'react'
import { WikiEntry } from '../types/wiki'
import { Search, ChevronRight, User, Sword, Map, Flag } from 'lucide-react'

interface HomeDashboardProps {
  data: WikiEntry[]
  onNavigate: (page: string) => void
  onEntryClick: (entry: WikiEntry) => void // [핵심] 상위에서 전달받은 클릭 핸들러
}

export const HomeDashboard = ({ data, onNavigate, onEntryClick }: HomeDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState('')

  // 통합 검색 필터링
  const searchResults = data.filter((entry) => {
    const term = searchTerm.toLowerCase()
    return (
      entry.name.toLowerCase().includes(term) ||
      entry.tags.some(tag => tag.toLowerCase().includes(term)) ||
      entry.type.toLowerCase().includes(term)
    )
  })

  // 데이터 분류
  const characters = data.filter(d => d.type === 'character' || (!d.type && (d as any).info?.role))
  const items = data.filter(d => d.type === 'item' || (!d.type && (d as any).info?.category))
  const locations = data.filter(d => d.type === 'location' || (!d.type && (d as any).info?.region))
  const factions = data.filter(d => d.type === 'faction' || (!d.type && (d as any).info?.leader))

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* 1. Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back, Writer.</h2>
          <p className="text-slate-400 mb-6 max-w-lg">
            세계관 데이터베이스가 가동 중입니다.<br/>
            총 <span className="text-blue-400 font-bold">{data.length}</span>개의 설정이 기록되어 있습니다.
          </p>

          <div className="relative max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="설정, 인물, 키워드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-600 rounded-full py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* 2. 섹션별 리스트 (종스크롤 구조) */}
      {searchTerm ? (
        // [검색 모드] 검색 결과 표시
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Search size={20} className="text-blue-400" />
            Search Results <span className="text-slate-500 text-sm">({searchResults.length})</span>
          </h3>
          <ResultGrid data={searchResults} onEntryClick={onEntryClick} />
        </div>
      ) : (
      <div className="space-y-10">
        <SectionGrid
          title="Character Archive"
          icon={<User className="text-blue-400" />}
          data={characters}
          pageId="characters"
          onNavigate={onNavigate}
          onEntryClick={onEntryClick} // 전달
          subtextKey="role"
        />

        <SectionGrid
          title="Item Storage"
          icon={<Sword className="text-purple-400" />}
          data={items}
          pageId="items"
          onNavigate={onNavigate}
          onEntryClick={onEntryClick} // 전달
          subtextKey="category"
        />

        <SectionGrid
          title="Locations"
          icon={<Map className="text-green-400" />}
          data={locations}
          pageId="locations"
          onNavigate={onNavigate}
          onEntryClick={onEntryClick} // 전달
          subtextKey="region"
        />

        <SectionGrid
          title="Factions"
          icon={<Flag className="text-orange-400" />}
          data={factions}
          pageId="factions"
          onNavigate={onNavigate}
          onEntryClick={onEntryClick} // 전달
          subtextKey="leader"
        />
      </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// 내부 컴포넌트: 섹션 그리드
// ----------------------------------------------------------------------
interface SectionGridProps {
  title: string
  icon: React.ReactNode
  data: WikiEntry[]
  pageId: string
  onNavigate: (page: string) => void
  onEntryClick: (entry: WikiEntry) => void // [추가됨]
  subtextKey: string
}

const SectionGrid = ({ title, icon, data, pageId, onNavigate, onEntryClick, subtextKey }: SectionGridProps) => {
  const previewData = data.slice(0, 5)

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {data.length}
          </span>
        </div>
        <button
          onClick={() => onNavigate(pageId)}
          className="text-sm text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
        >
          전체 보기 <ChevronRight size={14} />
        </button>
      </div>

      {data.length === 0 ? (
        <div className="h-32 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-sm">
          데이터가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {previewData.map((entry) => {
            const subtext = (entry as any).info?.[subtextKey] || entry.type

            return (
              <div
                key={entry.id}
                // [여기서 entry는 map 함수가 돌려주는 개별 데이터 아이템입니다]
                onClick={() => onEntryClick(entry)}
                className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer"
              >
                <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs font-mono">
                      NO IMAGE
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-slate-300 uppercase border border-white/10">
                    {entry.type}
                  </div>
                </div>

                <div className="p-3">
                  <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-blue-400 transition-colors">
                    {entry.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {subtext || '-'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}


const ResultGrid = ({ data, onEntryClick }: { data: WikiEntry[], onEntryClick: (entry: WikiEntry) => void }) => {
  if (data.length === 0) return <div className="text-slate-500">검색 결과가 없습니다.</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {data.map((entry) => (
        <div
          key={entry.id}
          onClick={() => onEntryClick(entry)}
          className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer"
        >
          <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
            {entry.image ? (
              <img src={entry.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs font-mono">NO IMG</div>
            )}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-slate-300 uppercase border border-white/10">
              {entry.type}
            </div>
          </div>
          <div className="p-3">
            <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-blue-400 transition-colors">
              {entry.name}
            </h4>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Found in Search
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
