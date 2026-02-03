import { useState } from 'react'
import { WikiEntry } from '../types/wiki'
import { Search, Plus } from 'lucide-react'
import { CreateNewModal } from '../components/Common/CreateNewModal'

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

  const handleCreateSuccess = () => {
    if (onRefresh) onRefresh()
  }

  // 검색 필터링 로직 (이름, 태그, 설명 검색)
  const filteredData = data.filter((entry) => {
    const term = searchTerm.toLowerCase()
    const matchName = entry.name.toLowerCase().includes(term)
    const matchTags = entry.tags.some((tag) => tag.toLowerCase().includes(term))
    return matchName || matchTags
  })

  return (
    <div className="min-h-screen animate-in fade-in duration-500 p-8">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-slate-400">{description}</p>
        </div>
        {createType && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-lg border border-slate-700 transition-colors"
          >
            <Plus size={16} /> Add {createType}
          </button>
        )}
      </header>

      {/* 검색 바 (UI만 존재, 기능은 추후 구현) */}
      <div className="mb-8 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder={`Search in ${title}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
          {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : '데이터가 없습니다.'}
        </div>
      ) : (
        // <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        //   {filteredData.map((entry) => {
        //     // [Logic] Draft 판별
        //     const isDraft = entry.id.includes('00_Draft')

        //     return (
        //       <div
        //         key={entry.id}
        //         onClick={() => onEntryClick(entry)}
        //         className={`bg-slate-900 border rounded-xl overflow-hidden hover:scale-[1.02] transition-all cursor-pointer group
        //           ${
        //             isDraft
        //               ? 'border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:border-amber-400'
        //               : 'border-slate-800 hover:border-blue-500/50'
        //           }`}
        //       >
        //         <div className="aspect-square relative bg-slate-950 overflow-hidden">
        //           {entry.image ? (
        //             <img
        //               src={entry.image}
        //               alt={entry.name}
        //               className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        //             />
        //           ) : (
        //             <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs">
        //               NO IMG
        //             </div>
        //           )}

        //           {/* Type Badge */}
        //           <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white uppercase backdrop-blur-sm">
        //             {entry.type}
        //           </div>

        //           {/* [NEW] Draft Badge */}
        //           {isDraft && (
        //             <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500/90 text-black font-bold text-[10px] rounded shadow-sm backdrop-blur-sm animate-pulse">
        //               NEW
        //             </div>
        //           )}
        //         </div>
        //         <div className="p-4">
        //           <h3
        //             className={`font-bold truncate ${isDraft ? 'text-amber-100' : 'text-slate-200'}`}
        //           >
        //             {entry.name}
        //           </h3>
        //           <p className="text-xs text-slate-500 mt-1 truncate">
        //             {(entry as any).info?.category ||
        //               (entry as any).info?.region ||
        //               (entry as any).info?.leader ||
        //               '-'}
        //           </p>
        //         </div>
        //       </div>
        //     )
        //   })}
        // </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {filteredData.map((entry) => {
            const isDraft = entry.id.includes('00_Draft')

            return (
              <div
                key={entry.id}
                onClick={() => onEntryClick(entry)}
                className={`flex flex-col items-center p-6 bg-slate-900/80 border rounded-3xl transition-all cursor-pointer group shadow-lg
          ${
            isDraft
              ? 'border-amber-500/40 shadow-amber-900/5 hover:border-amber-400'
              : 'border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/50'
          }`}
              >
                <div className="relative w-32 h-32 mb-5">
                  <div
                    className={`absolute -inset-1 rounded-full border border-dashed transition-colors
            ${isDraft ? 'border-amber-500/30' : 'border-slate-700 group-hover:border-blue-500/30'}`}
                  />

                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 border-slate-800 relative z-10 shadow-inner">
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

                  <div className="absolute top-0 -left-1 w-8 h-8 bg-slate-950 border border-slate-700 rounded-full z-20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <span className="text-[9px] text-slate-400 font-black uppercase">
                      {entry.type?.charAt(0) || '?'}
                    </span>
                  </div>

                  {isDraft && (
                    <div className="absolute top-0 -right-1 px-2 py-1 bg-amber-500 text-[9px] text-black font-black rounded-full z-20 shadow-lg animate-pulse">
                      NEW
                    </div>
                  )}
                </div>

                <div className="text-center w-full space-y-1">
                  <h3
                    className={`text-lg font-bold truncate tracking-tight transition-colors
            ${isDraft ? 'text-amber-200' : 'text-slate-100 group-hover:text-white'}`}
                  >
                    {entry.name}
                  </h3>

                  <p className="text-xs text-slate-500 font-medium truncate">
                    {(entry as any).info?.category ||
                      (entry as any).info?.region ||
                      (entry as any).info?.leader ||
                      'details'}
                  </p>

                  <div
                    className={`h-1 w-6 mx-auto rounded-full mt-3 transition-all duration-300
            ${isDraft ? 'bg-amber-500/20 group-hover:w-12 bg-amber-500/50' : 'bg-slate-800 group-hover:w-12 group-hover:bg-blue-500/30'}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

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
