import { useState } from 'react'
import { WikiEntry } from '../types/wiki'
import { Search, Plus, Filter } from 'lucide-react'
import { CreateNewModal } from '../components/Common/CreateNewModal'
import { useWikiFilter } from '../hooks/useWikiFilter'
import { FilterSidebar } from '../components/Archive/FilterSidebar'

interface GenericArchiveProps {
  title: string
  description: string
  data: WikiEntry[]
  createType?: string // 생성할 타입 (없으면 버튼 숨김)
  onRefresh?: () => void
  onEntryClick: (entry: WikiEntry) => void
}

export const GenericArchive = ({
  title,
  description,
  data,
  createType,
  onRefresh,
  onEntryClick
}: GenericArchiveProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // [NEW] Hook을 사용한 필터링 로직
  const { filters, options, filteredData: hookFilteredData, toggleFilter, resetFilters } = useWikiFilter(data)

  const handleCreateSuccess = () => {
    if (onRefresh) onRefresh()
  }

  // 검색 필터링 (Hook의 결과에 추가 검색 적용)
  const finalFilteredData = hookFilteredData.filter((entry) => {
    const term = searchTerm.toLowerCase()
    const matchName = entry.name.toLowerCase().includes(term)
    // 태그 검색은 이미 hook에서 처리하지만, 텍스트로도 검색 가능하게 유지
    const matchTags = entry.tags?.some((tag) => tag.toLowerCase().includes(term))
    return matchName || matchTags
  })

  // 현재 보고 있는 "페이지 타입" 추정 (데이터의 첫 번째 요소로 판별하거나 props로 받는 게 확실하긴 함)
  const entryType = createType || (data.length > 0 ? data[0].type : 'other')

  return (
    <div className="flex h-screen animate-in fade-in duration-500 overflow-hidden">
      {/* [NEW] Left Sidebar Filter */}
      <FilterSidebar
        filters={filters}
        options={options}
        onToggle={(cat, val) => toggleFilter(cat as any, val)}
        onReset={resetFilters}
        entryType={entryType}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-8">
        <header className="mb-0 flex items-center justify-between border-b border-slate-800 pb-6 flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              {description}
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-blue-400 font-mono">{finalFilteredData.length} entries</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
             {/* 검색 바 */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            {createType && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-lg border border-slate-700 transition-colors"
              >
                <Plus size={16} /> Add {createType}
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Grid Area */}
        <div className="flex-1 overflow-y-auto pr-2 pt-6 scrollbar-thin scrollbar-thumb-slate-700">
          {finalFilteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
              <Filter size={48} className="mb-4 opacity-20" />
              <p>조건에 맞는 데이터가 없습니다.</p>
              {(filters.grades.length > 0 || filters.statuses.length > 0) && (
                <button 
                  onClick={resetFilters}
                  className="mt-4 text-blue-400 hover:underline text-sm"
                >
                  필터 초기화
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
              {finalFilteredData.map((entry) => {
                const isDraft = entry.id.includes('00_Draft')
                const info = (entry as any).info || {}

                return (
                  <div
                    key={entry.id}
                    onClick={() => onEntryClick(entry)}
                    className={`flex flex-col items-center p-5 bg-slate-900/80 border rounded-2xl transition-all cursor-pointer group shadow-lg relative
              ${
                isDraft
                  ? 'border-amber-500/40 shadow-amber-900/5 hover:border-amber-400'
                  : 'border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/50'
              }`}
                  >
                     {/* Image & Avatar */}
                    <div className="relative w-24 h-24 mb-4">
                       {/* Status Indicator Ring (Character Only) */}
                       {entry.type === 'character' && info.status === 'DECEASED' && (
                         <div className="absolute -inset-1 rounded-full border-2 border-red-900/50 z-0"></div>
                       )}

                      <div
                        className={`absolute -inset-1 rounded-full border border-dashed transition-colors
                ${isDraft ? 'border-amber-500/30' : 'border-slate-700 group-hover:border-blue-500/30'}`}
                      />

                      <div className={`w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 relative z-10 shadow-inner
                          ${info.status === 'DECEASED' ? 'border-red-900 grayscale' : 'border-slate-800'}
                        `}>
                        {entry.image ? (
                          <img
                            src={entry.image}
                            alt={entry.name}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 text-[10px] font-bold">
                            NO IMAGE
                          </div>
                        )}
                      </div>

                      {/* Grade Badge */}
                      {info.grade && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] font-black uppercase rounded-full z-20 shadow-md border border-slate-900
                          ${info.grade === 'MAIN' ? 'bg-purple-500 text-white' : 
                            info.grade === 'SUB' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                          }
                        `}>
                          {info.grade}
                        </div>
                      )}
                    </div>

                    <div className="text-center w-full space-y-0.5">
                      <h3
                        className={`text-base font-bold truncate tracking-tight transition-colors
                ${isDraft ? 'text-amber-200' : 'text-slate-100 group-hover:text-white'}
                ${info.status === 'DECEASED' ? 'line-through decoration-red-500/50 text-slate-500' : ''}
                `}
                      >
                        {entry.name}
                      </h3>

                      <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-wider">
                        {info.role || info.category || info.region || '-'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateNewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        initialType={createType || 'other'}
        lockType={true}
      />
    </div>
  )
}
