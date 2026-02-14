import { useState } from 'react'
import { WikiEntry } from '../types/wiki'
import { Search, Plus, Filter, Layers, Sparkles, MessageSquarePlus, CheckCircle, X } from 'lucide-react'
import { CreateNewModal } from '../components/Common/CreateNewModal'
import { useWikiFilter } from '../hooks/useWikiFilter'
import { FilterBar } from '../components/Archive/FilterBar'
import { AgentChatPanel } from '../components/Common/AgentChatPanel'

interface GenericArchiveProps {
  title: string
  description: string
  data: WikiEntry[]
  createType?: string // 생성할 타입 (없으면 버튼 숨김)
  onRefresh?: () => void
  onEntryClick: (entry: WikiEntry) => void
  onNavigateToEpisode?: (id: string) => void
}

export const GenericArchive = ({
  title,
  description,
  data,
  createType,
  onRefresh,
  onEntryClick,
  onNavigateToEpisode
}: GenericArchiveProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [groupBy, setGroupBy] = useState<string>('') 

  // [AGENT MODE STATE]
  const [isAgentMode, setIsAgentMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isChatOpen, setIsChatOpen] = useState(false)

  // [NEW] Hook을 사용한 필터링 로직
  const { filters, options, filteredData: hookFilteredData, toggleFilter, resetFilters } = useWikiFilter(data)

  const handleCreateSuccess = () => {
    if (onRefresh) onRefresh()
  }

  // 검색 필터링 (Hook의 결과에 추가 검색 적용)
  const finalFilteredData = hookFilteredData.filter((entry) => {
    const term = searchTerm.toLowerCase()
    const matchName = entry.name.toLowerCase().includes(term)
    const matchTags = entry.tags?.some((tag) => tag.toLowerCase().includes(term))
    return matchName || matchTags
  })

  // 현재 보고 있는 "페이지 타입" 추정
  const entryType = createType || (data.length > 0 ? data[0].type : 'other')

  // [NEW] Group By Options Logic
  const getGroupByOptions = () => {
    switch (entryType) {
      case 'character':
        return [
          { value: '', label: 'None' },
          { value: 'status', label: '상태 (Status)' },
          { value: 'grade', label: '비중 (Grade)' },
          { value: 'role', label: '역할 (Role)' },
          { value: 'affiliation', label: '소속 (Affiliation)' }
        ]
      case 'item':
        return [
          { value: '', label: 'None' },
          { value: 'category', label: '종류 (Category)' },
          { value: 'rank', label: '등급 (Rank)' },
          { value: 'owner', label: '소유자 (Owner)' }
        ]
      case 'location':
        return [
          { value: '', label: 'None' },
          { value: 'region', label: '지역 (Region)' },
          { value: 'dangerLevel', label: '위험도 (Danger Level)' }
        ]
      case 'faction':
        return [
          { value: '', label: 'None' },
          { value: 'hostility', label: '우호도 (Hostility)' },
           { value: 'scale', label: '규모 (Scale)' }
        ]
      default:
        return [{ value: '', label: 'None' }]
    }
  }

  const groupByOptions = getGroupByOptions()

  // [AGENT MODE HANDLERS]
  const toggleAgentMode = () => {
      setIsAgentMode(!isAgentMode)
      setSelectedIds(new Set()) // Clear selection when toggling
      setIsChatOpen(false)
  }

  const handleCardClick = (entry: WikiEntry) => {
      if (isAgentMode) {
          const newSelected = new Set(selectedIds)
          if (newSelected.has(entry.id)) {
              newSelected.delete(entry.id)
          } else {
              newSelected.add(entry.id)
          }
          setSelectedIds(newSelected)
      } else {
          onEntryClick(entry)
      }
  }

  const handleCreateEpisode = () => {
      if (selectedIds.size === 0) return
      setIsChatOpen(true)
  }

  // Save Generated Episode
  const handleSaveEpisode = async (title: string, content: string, tags: string[]) => {
      try {
          // @ts-ignore
          const result = await window.api.createWikiEntry({
              type: 'episode',
              title: title,
              content: content,
              tags: tags,
              image: '', // Optional: could ask AI for image prompt later
          })

          if (result.success) {
              alert(`에피소드 '${title}'가 생성되었습니다!`)
              // We might want to clear selection or keep it?
              // setSelectedIds(new Set()) 
              // setIsChatOpen(false)
              if (onRefresh) onRefresh() // Refresh data mainly
              return result.path // Return the ID (path)
          } else {
              alert('에피소드 저장 실패: ' + result.message)
          }
      } catch (error) {
          console.error('Failed to create episode:', error)
          alert('에피소드 저장 중 오류가 발생했습니다.')
      }
  }

  // [NEW] Render Card Helper
  const renderCard = (entry: WikiEntry) => {
    const isDraft = entry.id.includes('00_Draft')
    const info = (entry as any).info || {}
    const isSelected = selectedIds.has(entry.id)

    return (
      <div
        key={entry.id}
        onClick={() => handleCardClick(entry)}
        className={`flex flex-col items-center p-5 border rounded-2xl transition-all cursor-pointer group shadow-lg relative
        ${isAgentMode 
            ? (isSelected 
                ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500 transform scale-95' 
                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80 opacity-60 hover:opacity-100')
            : (isDraft
                ? 'bg-slate-900/80 border-amber-500/40 shadow-amber-900/5 hover:border-amber-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/50')
        }
        `}
      >
        {/* Agent Mode Selection Indicator */}
        {isAgentMode && (
            <div className={`absolute top-3 right-3 z-30 transition-all duration-200
                ${isSelected ? 'text-blue-500 scale-110' : 'text-slate-600 group-hover:text-slate-400'}
            `}>
                <CheckCircle size={24} fill={isSelected ? "currentColor" : "none"} />
            </div>
        )}

        {/* Image & Avatar */}
        <div className="relative w-24 h-24 mb-4">
          {/* Status Indicator Ring (Character Only) */}
          {entry.type === 'character' && info.status === 'DECEASED' && !isAgentMode && (
            <div className="absolute -inset-1 rounded-full border-2 border-red-900/50 z-0"></div>
          )}

          <div
            className={`absolute -inset-1 rounded-full border border-dashed transition-colors
            ${isAgentMode 
                ? (isSelected ? 'border-blue-500 animate-spin-slow' : 'border-slate-700')
                : (isDraft ? 'border-amber-500/30' : 'border-slate-700 group-hover:border-blue-500/30')
            }`}
          />

          <div className={`w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 relative z-10 shadow-inner
              ${info.status === 'DECEASED' && !isAgentMode ? 'border-red-900 grayscale' : 'border-slate-800'}
            `}>
            {entry.image ? (
              <img
                src={entry.image}
                alt={entry.name}
                className={`w-full h-full object-cover transition-all duration-500
                    ${isAgentMode && !isSelected ? 'opacity-50 grayscale' : 'opacity-90 group-hover:opacity-100'}
                `}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700 text-[10px] font-bold">
                NO IMAGE
              </div>
            )}
          </div>

          {/* Grade Badge */}
          {info.grade && !isAgentMode && (
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
            ${isAgentMode && isSelected ? 'text-blue-400' : 'text-slate-100'}
            ${isDraft ? 'text-amber-200' : ''}
            ${info.status === 'DECEASED' && !isAgentMode ? 'line-through decoration-red-500/50 text-slate-500' : ''}
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
  }

  const selectedEntries = data.filter(d => selectedIds.has(d.id))

  return (
    <div className="flex flex-col h-screen animate-in fade-in duration-500 overflow-hidden bg-slate-950 text-white relative">
      {/* Main Content Area - No longer nested in a flex-row with sidebar */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 md:p-8">
        <header className="mb-0 flex items-center justify-between pb-6 flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              {description}
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-blue-400 font-mono">{finalFilteredData.length} entries</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
             {/* [NEW] Agent Mode Toggle */}
             <button
                onClick={toggleAgentMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs border transition-all
                    ${isAgentMode 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'}
                `}
             >
                <Sparkles size={14} />
                {isAgentMode ? 'Agent Active' : 'Agent Mode'}
             </button>

             {/* [NEW] Group By Selector */}
             <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                <Layers size={14} className="text-slate-500" />
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="bg-transparent text-sm text-slate-300 focus:outline-none cursor-pointer"
                >
                  {groupByOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">
                      {opt.value === '' ? 'Group: None' : opt.label}
                    </option>
                  ))}
                </select>
             </div>

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

        {/* [NEW] Filter Bar (Horizontal) */}
        <FilterBar
          filters={filters}
          options={options}
          onToggle={(cat, val) => toggleFilter(cat as any, val)}
          onReset={resetFilters}
          entryType={entryType}
        />

        {/* Scrollable Grid Area */}
        <div className="flex-1 overflow-y-auto pr-2 pt-2 scrollbar-thin scrollbar-thumb-slate-700">
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
             groupBy ? (
               <div className="space-y-8 pb-20">
                 {Object.entries(
                   finalFilteredData.reduce((acc, entry) => {
                     const info = (entry as any).info || {}
                     // Ensure fallback is consistent
                     const key = info[groupBy] || 'Uncategorized'
                     if (!acc[key]) acc[key] = []
                     acc[key].push(entry)
                     return acc
                   }, {} as Record<string, WikiEntry[]>)
                 )
                 .sort(([keyA], [keyB]) => {
                    // Sorting Logic
                    if (groupBy === 'grade') {
                        const order = ['MAIN', 'SUB', 'MINOR', 'EXTRA', 'Uncategorized'];
                        const idxA = order.indexOf(keyA);
                        const idxB = order.indexOf(keyB);
                        const safeIdxA = idxA === -1 ? 99 : idxA;
                        const safeIdxB = idxB === -1 ? 99 : idxB;
                        return safeIdxA - safeIdxB;
                    }
                    if (groupBy === 'status') {
                        const order = ['ALIVE', 'UNKNOWN', 'DECEASED', 'Uncategorized'];
                        const idxA = order.indexOf(keyA);
                        const idxB = order.indexOf(keyB);
                        const safeIdxA = idxA === -1 ? 99 : idxA;
                        const safeIdxB = idxB === -1 ? 99 : idxB;
                        return safeIdxA - safeIdxB;
                    }
                    if (groupBy === 'rank') {
                         const order = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'Uncategorized'];
                         const idxA = order.indexOf(keyA);
                         const idxB = order.indexOf(keyB);
                         const safeIdxA = idxA === -1 ? 99 : idxA;
                         const safeIdxB = idxB === -1 ? 99 : idxB;
                         return safeIdxA - safeIdxB;
                    }
                    // Default Alphabetical
                    return keyA.localeCompare(keyB);
                 })
                 .map(([group, filteredEntries]) => (
                   <div key={group}>
                     <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                       <span className="px-2 py-0.5 bg-slate-800 rounded text-sm text-slate-400">
                          {groupBy.toUpperCase()}
                       </span>
                       {group} 
                       <span className="text-sm font-normal text-slate-500 ml-2">
                         ({filteredEntries.length})
                       </span>
                     </h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredEntries.map((entry) => renderCard(entry))}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
                 {finalFilteredData.map((entry) => renderCard(entry))}
               </div>
             )
          )}
        </div>
      </div>

      {/* [NEW] Floating Action Bar (When Items Selected) */}
      {selectedIds.size > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl p-2 flex items-center gap-2 pr-4">
                  <div className="flex -space-x-2 pl-2">
                       {selectedEntries.slice(0, 3).map(e => (
                           <div key={e.id} className="w-8 h-8 rounded-full border-2 border-[#1e293b] overflow-hidden bg-slate-800">
                               {e.image ? <img src={e.image} className="w-full h-full object-cover" /> : null}
                           </div>
                       ))}
                       {selectedIds.size > 3 && (
                           <div className="w-8 h-8 rounded-full border-2 border-[#1e293b] bg-slate-700 text-slate-300 text-[10px] flex items-center justify-center font-bold">
                               +{selectedIds.size - 3}
                           </div>
                       )}
                  </div>
                  
                  <div className="h-8 w-px bg-slate-700 mx-2" />
                  
                  <span className="text-sm text-slate-300 font-bold mr-2">
                      {selectedIds.size} Selected
                  </span>
                  
                  <button 
                    onClick={handleCreateEpisode}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/40 transform hover:scale-105"
                  >
                      <MessageSquarePlus size={16} />
                      에피소드 생성
                  </button>

                  <button 
                     onClick={() => setSelectedIds(new Set())}
                     className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                      <X size={18} />
                  </button>
              </div>
          </div>
      )}

      <AgentChatPanel 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          selectedEntries={selectedEntries}
          onSaveEpisode={handleSaveEpisode}
          onNavigateToEpisode={onNavigateToEpisode}
      />

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
