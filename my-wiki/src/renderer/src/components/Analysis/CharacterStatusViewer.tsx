import { useState, useEffect, useMemo } from 'react'
import { Activity, Layers, HeartHandshake, ChevronLeft, ChevronRight, Hash, ChevronDown, ChevronUp } from 'lucide-react'
import { ActBoard, SceneCard } from '../../types/plot'

import { WikiEntry } from '../../../../shared/types/wiki'

interface CharacterStatusViewerProps {
  entry: WikiEntry
}

interface SnapshotState {
    status: Record<string, any>
    relations: Record<string, any>
    lastUpdatedScene: string
}

export const CharacterStatusViewer = ({ entry }: CharacterStatusViewerProps) => {
  const [plotData, setPlotData] = useState<ActBoard[]>([])
  const [flattenedScenes, setFlattenedScenes] = useState<SceneCard[]>([])
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(-1) // Index in flattenedScenes
  
  // Section Visibility State
  const [expanded, setExpanded] = useState({ status: true, relations: true })
  const toggleSection = (key: 'status' | 'relations') => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const characterName = entry.name
  // @ts-ignore
  const aliases = entry.aliases || []

  // 1. Fetch & Filter Data
  useEffect(() => {
    (async () => {
        try {
            // @ts-ignore
            const acts: ActBoard[] = await window.api.getPlotData()
            
            // Filter Tree to find ALL scenes relevant to character, then flatten
            // We need a linear timeline for the slider/selector
            const scenes: SceneCard[] = []
            
            acts.forEach(act => {
                act.chapters.forEach((chap: any) => {
                    chap.scenes.forEach((scene: SceneCard) => {
                         // Check relevance
                         const inTags = scene.characters?.includes(characterName)
                         const inAppear = scene.delta?.appear?.some(n => n === characterName || aliases.includes(n))
                         const inUpdate = scene.delta?.update?.some(u => u.name === characterName)
                         const inRelations = scene.delta?.relations?.some(r => r.source === characterName || r.name === characterName)

                         if (inTags || inAppear || inUpdate || inRelations) {
                             // Inject act/chapter info if missing for easier lookup
                             scenes.push({ ...scene, actId: act.id, actTitle: act.title, chapterTitle: chap.title, chapterNumber: chap.chapterNumber } as any)
                         }
                    })
                })
            })

            setPlotData(acts)
            setFlattenedScenes(scenes)
            
            // Default to Latest
            if (scenes.length > 0) {
                setSelectedSceneIndex(scenes.length - 1)
            }

        } catch (e) {
            console.error("Failed to load plot data", e)
        }
    })()
  }, [characterName, aliases])

  // 2. Calculate Snapshot
  const snapshot = useMemo<SnapshotState>(() => {
      const state: SnapshotState = { status: {}, relations: {}, lastUpdatedScene: '' }
      
      if (selectedSceneIndex === -1 || flattenedScenes.length === 0) return state

      // Traverse from 0 to selectedIndex
      for (let i = 0; i <= selectedSceneIndex; i++) {
          const scene = flattenedScenes[i]
          
          // Update Status
          const myUpdates = scene.delta?.update?.find(u => u.name === characterName)
          if (myUpdates && myUpdates.changes) {
              state.status = { ...state.status, ...myUpdates.changes }
          }
          
          // Update Relations
          // Logic: Relation Key = Target Name. Latest write wins.
          const myRelations = scene.delta?.relations?.filter(r => r.source === characterName || r.name === characterName)
          if (myRelations) {
              myRelations.forEach(rel => {
                  const target = rel.source === characterName ? rel.name : rel.source
                  state.relations[target] = rel 
              })
          }
          
          if (i === selectedSceneIndex) {
               state.lastUpdatedScene = `${scene.sceneNumber}화 SCENE ${scene.sceneNumber}` 
          }
      }
      return state
  }, [selectedSceneIndex, flattenedScenes, characterName])

  // Navigation Helpers
  const currentScene = flattenedScenes[selectedSceneIndex]
  
  // Find Acts containing relevant scenes for the dropdown
  const relevantActs = useMemo(() => {
        // Only show Acts that actually have scenes in our flattened list
        const actIds = new Set(flattenedScenes.map((s: any) => s.actId))
        return plotData.filter(act => actIds.has(act.id))
  }, [plotData, flattenedScenes])

  // Current Selection Context
  const currentActId = (currentScene as any)?.actId
  const currentChapNum = (currentScene as any)?.chapterNumber

  // Handlers
  const handlePrev = () => setSelectedSceneIndex(prev => Math.max(0, prev - 1))
  const handleNext = () => setSelectedSceneIndex(prev => Math.min(flattenedScenes.length - 1, prev + 1))
  
  const handleActChange = (actId: string) => {
      // Jump to first scene of this Act
      const firstSceneInAct = flattenedScenes.findIndex((s: any) => s.actId === actId)
      if (firstSceneInAct !== -1) setSelectedSceneIndex(firstSceneInAct)
  }

  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const chapNum = parseInt(e.target.value)
      // Jump to first scene of this Chapter
      const idx = flattenedScenes.findIndex((s: any) => s.chapterNumber === chapNum)
      if (idx !== -1) setSelectedSceneIndex(idx)
  }

  return (
    <div className="w-full h-full bg-[#0b0c15] text-slate-300 p-6 overflow-y-auto flex flex-col">
         {/* Navigation & Control Bar */}
         <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 mb-6 sticky top-0 backdrop-blur-md z-20 shadow-lg">
             <div className="flex flex-col gap-3">
                 {/* Top Row: Title */}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                        <Activity className="text-blue-500" size={16} />
                        <span className="text-white">Snapshot State</span>
                        <span className="text-xs text-slate-600 font-normal ml-2">
                             Event {selectedSceneIndex + 1} / {flattenedScenes.length}
                        </span>
                    </div>
                 </div>

                 {/* Bottom Row: Navigation Controls */}
                 <div className="flex items-center gap-2">
                     {/* Act Select */}
                     <select 
                        value={currentActId || ''} 
                        onChange={(e) => handleActChange(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 max-w-[120px] truncate"
                     >
                         {relevantActs.map(act => (
                             <option key={act.id} value={act.id}>{act.title}</option>
                         ))}
                     </select>

                     <span className="text-slate-600">/</span>

                     {/* Chapter Select (Filtered by current Act) */}
                     <select
                        value={currentChapNum || ''} 
                        onChange={handleChapterChange}
                        className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 flex-1 min-w-0"
                     >
                         {relevantActs.find(a => a.id === currentActId)?.chapters.map((chap: any) => (
                             <option key={chap.id} value={chap.chapterNumber}>
                                 {chap.chapterNumber}화. {chap.title.replace(/^\d+화_/, '')}
                             </option>
                         ))}
                     </select>

                     {/* Scene Stepper */}
                     <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button 
                            onClick={handlePrev} 
                            disabled={selectedSceneIndex <= 0}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg border border-slate-700"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-purple-400 min-w-[80px] text-center">
                            {currentScene ? `SCENE ${currentScene.sceneNumber}` : '-'}
                        </div>
                        <button 
                            onClick={handleNext} 
                            disabled={selectedSceneIndex >= flattenedScenes.length - 1}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg border border-slate-700"
                        >
                            <ChevronRight size={16} />
                        </button>
                     </div>
                 </div>
             </div>
         </div>

         {/* Content Area (Stacked) */}
         <div className="flex flex-col space-y-6 pb-20">
             
             {/* SECTION 1: Status */}
             <div className="space-y-4">
                 <button 
                    onClick={() => toggleSection('status')}
                    className="w-full flex items-center justify-between text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 hover:text-slate-200 transition-colors"
                 >
                     <div className="flex items-center gap-2">
                        <Layers size={16} className="text-blue-500" /> Traits & Status
                     </div>
                     {expanded.status ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                 </button>
                 
                 {expanded.status && (
                     <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        {Object.keys(snapshot.status).length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-600 italic">
                                No status updates found up to this point.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(snapshot.status).map(([key, val]) => (
                                    <div key={key} className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg hover:border-blue-500/50 transition-colors shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{key}</span>
                                        <span className="text-sm text-slate-200 font-medium leading-snug break-words">{String(val)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                 )}
             </div>

             {/* SECTION 2: Relations */}
             <div className="space-y-4">
                 <button 
                    onClick={() => toggleSection('relations')}
                    className="w-full flex items-center justify-between text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 hover:text-slate-200 transition-colors"
                 >
                     <div className="flex items-center gap-2">
                        <HeartHandshake size={16} className="text-pink-500" /> Relationships
                     </div>
                     {expanded.relations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                 </button>

                 {expanded.relations && (
                     <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        {Object.keys(snapshot.relations).length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-600 italic">
                                No relationships found up to this point.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(snapshot.relations).map(([target, rel]: [string, any]) => (
                                     <div key={target} className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg hover:border-pink-500/50 transition-colors shadow-sm relative group overflow-hidden">
                                         <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Hash size={12} className="text-slate-600" />
                                                    <span className="text-sm font-bold text-slate-300">{target}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-700 font-mono group-hover:text-slate-500 transition-colors">
                                                    SCENE {rel.sceneNumber}
                                                </span>
                                            </div>
                                            <div className="text-xs text-pink-400 font-medium pl-5 border-l-2 border-slate-800">
                                                {rel.display || rel.mood || rel.type}
                                            </div>
                                         </div>
                                     </div>
                                ))}
                            </div>
                        )}
                     </div>
                 )}
             </div>
         </div>
    </div>
  )
}
