import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronDown, ChevronRight, LayoutList, Layers, Users } from 'lucide-react'
import { ActBoard, ChapterColumn, SceneCard } from '../../types/plot'

interface CharacterHistoryViewerProps {
  characterName: string
  aliases?: string[]
}

export const CharacterHistoryViewer = ({ characterName, aliases = [] }: CharacterHistoryViewerProps) => {
  const [filteredActs, setFilteredActs] = useState<any[]>([]) 
  const [expandedActs, setExpandedActs] = useState<Record<string, boolean>>({}) 
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({})

  // 1. Fetch & Filter Data
  useEffect(() => {
    (async () => {
        try {
            // @ts-ignore
            const acts: ActBoard[] = await window.api.getPlotData()
            
            // Filter Tree based on Character Appearance
            const filtered = acts.map(act => {
                const validChapters = act.chapters.map(chap => {
                    const validScenes = chap.scenes.filter(scene => {
                        // Check explicit character tag OR 'appear' list in delta
                        const inTags = scene.characters?.includes(characterName)
                        const inAppear = scene.delta?.appear?.some(n => n === characterName || aliases.includes(n))
                        // Also check if they are in 'update' list
                        const inUpdate = scene.delta?.update?.some(u => u.name === characterName)
                        
                        return inTags || inAppear || inUpdate
                    })
                    
                    if (validScenes.length === 0) return null
                    return { ...chap, scenes: validScenes }
                }).filter(Boolean) as ChapterColumn[]

                if (validChapters.length === 0) return null
                return { ...act, chapters: validChapters }
            }).filter(Boolean)

            setFilteredActs(filtered)

            // Auto-expand latest
            if (filtered.length > 0) {
                const lastAct = filtered[filtered.length - 1]
                if (lastAct) {
                   setExpandedActs({ [lastAct.title]: true })
                   const chaps: Record<number, boolean> = {}
                   lastAct.chapters.forEach((c: any) => { chaps[c.chapterNumber] = true })
                   setExpandedChapters(chaps)
                }
            }

        } catch (e) {
            console.error("Failed to load plot data", e)
        }
    })()
  }, [characterName, aliases]) // Added aliases to dependency array

  const toggleAct = (actTitle: string) => {
      setExpandedActs(prev => ({ ...prev, [actTitle]: !prev[actTitle] }))
  }

  const toggleChapter = (chapNum: number) => {
      setExpandedChapters(prev => ({ ...prev, [chapNum]: !prev[chapNum] }))
  }

  return (
    <div className="w-full h-full bg-[#0b0c15] text-slate-300 p-6 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutList className="text-purple-400" size={20} /> 
            Timeline: <span className="text-white/70">{characterName}</span>
         </h2>
         <span className="text-xs text-slate-500">Auto-generated from Scene Data</span>
      </div>

      <div className="space-y-4 pb-20">
        {filteredActs.map((act) => (
            <div key={act.id} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20">
                {/* Act Header */}
                <button 
                    onClick={() => toggleAct(act.title)}
                    className="w-full flex items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-800 transition-colors border-b border-slate-800"
                >
                    <div className="flex items-center gap-3">
                        {expandedActs[act.title] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                             <Layers size={14} className="text-purple-500"/> {act.title}
                        </span>
                    </div>
                    <span className="text-xs text-slate-600 font-mono">{act.chapters.length} Active Chaps</span>
                </button>

                {/* Chapters */}
                <AnimatePresence>
                    {expandedActs[act.title] && (
                        <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: 'auto' }} 
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-3 space-y-3 bg-[#0b0e14]/50">
                                {act.chapters.map((chap: any) => {
                                    const isExpanded = expandedChapters[chap.chapterNumber]
                                    return (
                                        <div key={chap.id} className="border-l-2 border-slate-800 ml-2 pl-3">
                                            <button 
                                                onClick={() => toggleChapter(chap.chapterNumber)}
                                                className="flex items-center gap-2 py-1 text-slate-400 hover:text-blue-400 transition-colors w-full text-left font-medium text-sm mb-2"
                                            >
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <span>{chap.chapterNumber}화. {chap.title.replace(/^\d+화_/, '')}</span>
                                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500 ml-auto mr-2">
                                                    {chap.scenes.length} Scenes
                                                </span>
                                            </button>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="space-y-3 pl-2"
                                                    >
                                                        {chap.scenes.map((scene: SceneCard) => (
                                                            <SceneLogCard key={scene.id} scene={scene} charName={characterName} />
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        ))}

        {filteredActs.length === 0 && (
             <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                 <p>No appearance history found for {characterName}.</p>
                 <p className="text-xs mt-2">Check if the character is tagged in any scenes.</p>
             </div>
        )}
      </div>
    </div>
  )
}

// Sub-component for individual Scene Card
const SceneLogCard = ({ scene, charName }: { scene: SceneCard, charName: string }) => {
    // Extract specific updates for this character
    const myUpdates = scene.delta?.update?.find(u => u.name === charName)
    const myRelations = scene.delta?.relations?.filter(r => r.source === charName || r.name === charName)

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50">
                <div className="flex items-center gap-2 text-xs text-purple-400 font-bold">
                    <Clock size={12} />
                    SCENE {scene.sceneNumber}
                </div>
                {/* <span className="text-[10px] text-slate-600">{scene.title}</span> */}
            </div>
            
            {/* 1. Scene Summary (Generic) - Maybe too long? Truncate or only show if important? */}
            {/* Let's show specific character actions if available, otherwise generic summary */}
            {scene.summary && (
                <div className="mb-3">
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{scene.summary}</p>
                </div>
            )}
            
            {/* 2. Status Updates */}
            {myUpdates && myUpdates.changes && (
                <div className="mb-2 bg-slate-950/50 p-2 rounded">
                    <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Status Changes</span>
                    <ul className="space-y-1">
                        {Object.entries(myUpdates.changes).map(([key, val], i) => (
                            <li key={i} className="text-[11px] text-slate-400 flex items-center gap-1">
                                <span className="text-slate-500">{key}:</span> {String(val)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 3. Relations */}
            {myRelations && myRelations.length > 0 && (
                 <div className="bg-slate-950/50 p-2 rounded">
                    <span className="text-[10px] font-bold text-pink-400 uppercase block mb-1">Relations</span>
                    <ul className="space-y-1">
                        {myRelations.map((r, i) => {
                             const isSource = r.source === charName
                             const target = isSource ? r.name : r.source
                             return (
                                <li key={i} className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <Users size={10} />
                                    <span className="text-slate-300">{target}</span>
                                    <span className="text-slate-600">→</span>
                                    <span>{r.display || r.mood || 'Update'}</span>
                                </li>
                             )
                        })}
                    </ul>
                 </div>
            )}
        </div>
    )
}
