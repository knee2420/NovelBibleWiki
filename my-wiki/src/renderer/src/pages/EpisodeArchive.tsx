import { useState, useEffect } from 'react'
import { WikiEntry } from '../types/wiki'
import { EpisodeCreateModal } from '../components/Episode/EpisodeCreateModal'
import { EpisodeDetailModal } from '../components/Episode/EpisodeDetailModal'
import { Plus, Search, Clapperboard, CheckCircle2, Circle } from 'lucide-react'

interface EpisodeArchiveProps {
    onEntryClick: (entry: WikiEntry) => void
}

export const EpisodeArchive = ({ onEntryClick }: EpisodeArchiveProps) => {
  const [episodes, setEpisodes] = useState<WikiEntry[]>([])
  const [allWikiData, setAllWikiData] = useState<WikiEntry[]>([]) // Store all
  const [searchTerm, setSearchTerm] = useState('')
  const [ismnCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState<WikiEntry | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchEpisodes = async () => {
      // @ts-ignore
      const allData = await window.api.getWikiData() as WikiEntry[]
      setAllWikiData(allData)
      const episodeData = allData.filter(d => d.type === 'episode')
      setEpisodes(episodeData)
    }
    fetchEpisodes()
  }, [refreshKey])

  const handleRefresh = () => setRefreshKey(prev => prev + 1)

  // Find entry by tag and click it
  const handleTagClick = (tagName: string) => {
      // Normalize tag (remove spaces, lowercase) for better matching? Or exact match?
      // WikiEntry name is exact properly.
      const target = allWikiData.find(d => d.name === tagName || (d as any).info?.alias === tagName)
      if (target) {
          onEntryClick(target) // Open WikiDetailModal in App (or handle here if we want)
          // Since onEntryClick sets selectedEntryId in App, it will open WikiDetailModal.
          // But EpisodeDetailModal is also open.
          // If we want to switch context, we close EpisodeDetailModal?
          setSelectedEpisode(null)
      } else {
          // Maybe just set search term?
          setSearchTerm(tagName)
          setSelectedEpisode(null) // Search in episodes
      }
  }

  const toggleStatus = async (e: React.MouseEvent, entry: WikiEntry) => {
    e.stopPropagation() // Prevent card click
    const currentStatus = (entry.info as any)?.isUsed || false
    const newStatus = !currentStatus

    try {
        // @ts-ignore
        await window.api.saveWikiEntry({
            id: entry.id,
            title: entry.name,
            type: entry.type,
            tags: entry.tags,
            content: entry.content,
            info: {
                ...entry.info,
                isUsed: newStatus
            }
        })
        handleRefresh()
    } catch (error) {
        console.error("Failed to toggle status", error)
    }
  }

  const filteredEpisodes = episodes.filter(ep => 
    ep.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ep.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const renderCard = (ep: WikiEntry) => {
    const isUsed = (ep.info as any)?.isUsed || false
    const imageUrl = ep.image || (ep.info as any)?.image 

    return (
        <div 
            key={ep.id}
            onClick={() => setSelectedEpisode(ep)}
            className={`group relative bg-[#11121c] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                ${isUsed ? 'border-slate-800 opacity-60 hover:opacity-100 grayscale hover:grayscale-0' : 'border-slate-700 hover:border-blue-500/50'}
            `}
        >
            {/* Image Placeholder */}
            <div className="aspect-video bg-black relative overflow-hidden">
                {imageUrl ? (
                    <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-700 font-bold uppercase tracking-wider text-xs">
                        No Image
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#11121c] via-transparent to-transparent opacity-80" />
                
                {/* Status Toggle (On Card) */}
                <button
                    onClick={(e) => toggleStatus(e, ep)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md border transition-all z-10
                        ${isUsed ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white'}
                    `}
                    title={isUsed ? "사용 완료 (Used)" : "미사용 (Unused)"}
                >
                    {isUsed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
            </div>

            {/* Content */}
            <div className="p-5 relative">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg truncate pr-2 ${isUsed ? 'text-slate-500 decoration-slate-600 line-through' : 'text-slate-100 group-hover:text-blue-400 transition-colors'}`}>
                            {ep.name}
                        </h3>
                    </div>
                </div>

                <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">
                    {ep.content?.replace(/[#*`]/g, '').slice(0, 100) || '내용 없음'}
                </p>

                {/* Footer (Tags) */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                     <div className="flex gap-1.5 overflow-hidden">
                        {ep.tags?.slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800/50 text-slate-500 text-[10px] rounded border border-slate-700/50">
                                #{tag}
                            </span>
                        ))}
                        {(ep.tags?.length || 0) > 2 && (
                            <span className="text-[10px] text-slate-600">+{ep.tags!.length - 2}</span>
                        )}
                     </div>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#0b0c15] text-slate-200 p-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Clapperboard className="text-blue-500" size={32} />
                    Example Episodes
                </h1>
                <p className="text-slate-400 mt-1 flex items-center gap-2">
                    작품에 사용될 에피소드 아이디어 보관소
                    <span className="w-1 h-1 bg-slate-600 rounded-full"/>
                    <span className="text-blue-400 font-mono">{filteredEpisodes.length} Items</span>
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search episodes..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500 outline-none w-64"
                    />
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Plus size={16} /> 새 에피소드 추가
                </button>
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar space-y-12">
            {filteredEpisodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <p>검색 결과가 없습니다.</p>
                </div>
            ) : (
                <>
                    {/* Available Episodes */}
                    {filteredEpisodes.some(ep => !((ep.info as any)?.isUsed)) && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-300 flex items-center gap-2">
                                <Circle className="text-blue-500 fill-blue-500/20" size={16} />
                                사용 가능 <span className="text-slate-500 text-sm font-normal">({filteredEpisodes.filter(ep => !((ep.info as any)?.isUsed)).length})</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {filteredEpisodes.filter(ep => !((ep.info as any)?.isUsed)).map(ep => renderCard(ep))}
                            </div>
                        </div>
                    )}

                    {/* Used Episodes */}
                    {filteredEpisodes.some(ep => (ep.info as any)?.isUsed) && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-500 flex items-center gap-2">
                                <CheckCircle2 className="text-green-500/50" size={16} />
                                사용 완료 <span className="text-slate-600 text-sm font-normal">({filteredEpisodes.filter(ep => (ep.info as any)?.isUsed).length})</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {filteredEpisodes.filter(ep => (ep.info as any)?.isUsed).map(ep => renderCard(ep))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Modals */}
        <EpisodeCreateModal 
            isOpen={ismnCreateOpen} 
            onClose={() => setIsCreateOpen(false)} 
            onSuccess={handleRefresh} 
        />
        
        {selectedEpisode && (
            <EpisodeDetailModal 
                entry={selectedEpisode}
                onClose={() => setSelectedEpisode(null)} 
                onUpdate={handleRefresh}
                onTagClick={handleTagClick} // [NEW] Pass click handler
            />
        )}
    </div>
  )
}
