import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Box, Map, Shield, Plus, Merge, SkipForward, Check, ChevronRight, Search } from 'lucide-react'
import { PendingEntity, EntityDecision } from '../../hooks/useEntityReview'
import { WikiEntry } from '../../types/wiki'

interface EntityReviewDashboardProps {
  isOpen: boolean
  pendingEntities: Record<string, PendingEntity[]>
  decisions: Record<string, Record<string, EntityDecision>>
  existingEntities: WikiEntry[]
  onDecision: (decision: EntityDecision) => void
  onApply: () => void
  onCancel: () => void
}

const TABS = [
  { id: 'character', label: 'Characters', icon: User },
  { id: 'item', label: 'Items', icon: Box },
  { id: 'location', label: 'Locations', icon: Map },
  { id: 'faction', label: 'Factions', icon: Shield },
]

export const EntityReviewDashboard = ({
  isOpen,
  pendingEntities,
  decisions,
  existingEntities = [],
  onDecision,
  onApply,
  onCancel
}: EntityReviewDashboardProps) => {

  const [activeTab, setActiveTab] = useState('character')

  if (!isOpen) return null

  // Calculate stats
  const totalCount = Object.values(pendingEntities).reduce((acc, arr) => acc + arr.length, 0)
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl h-[80vh] flex flex-col bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
           <div>
               <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                   <span className="bg-purple-600/20 p-2 rounded-lg text-purple-400">
                       <Plus size={24} />
                   </span>
                   New Entities Detected
               </h2>
               <p className="text-slate-400 text-sm mt-1">
                   AI has found {totalCount} new entities. Review and add them to your Wiki.
               </p>
           </div>
           
           <div className="flex gap-3">
               <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium">
                   Skip All
               </button>
               <button onClick={onApply} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 text-sm flex items-center gap-2">
                   Apply Changes <ChevronRight size={16} />
               </button>
           </div>
        </div>

        {/* Dashboard Body */}
        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 gap-2">
                {TABS.map(tab => {
                    const count = pendingEntities[tab.id]?.length || 0
                    const isActive = activeTab === tab.id
                    
                    if (count === 0) return null

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-between p-3 rounded-lg text-sm font-bold transition-all
                                ${isActive 
                                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/30' 
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon size={16} />
                                {tab.label}
                            </div>
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-400">{count}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-950 p-6 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                    >
                        {pendingEntities[activeTab]?.map((entity) => (
                            <EntityCard 
                                key={entity.name} 
                                entity={entity} 
                                decision={decisions[activeTab]?.[entity.name]}
                                onDecision={(d) => onDecision(d)}
                                existingEntities={existingEntities}
                            />
                        ))}
                        {pendingEntities[activeTab]?.length === 0 && (
                            <div className="col-span-2 text-center py-20 text-slate-600">
                                No new entities in this category.
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
        
      </div>
    </div>
  )
}

// Sub-component: Entity Card
const EntityCard = ({ 
    entity, 
    decision, 
    onDecision,
    existingEntities 
}: { 
    entity: PendingEntity, 
    decision?: EntityDecision, 
    onDecision: (d: EntityDecision) => void,
    existingEntities: WikiEntry[]
}) => {
    const isSkipped = decision?.action === 'skip'
    const isMerged = decision?.action === 'merge'
    const isCreated = decision?.action === 'create'

    // Filter potential merge targets based on type
    const mergeTargets = useMemo(() => {
        return existingEntities.filter(e => e.type === entity.type)
    }, [existingEntities, entity.type])

    const [searchTerm, setSearchTerm] = useState('')
    
    // Filtered list for display
    const filteredTargets = useMemo(() => {
        if (!searchTerm) return mergeTargets
        return mergeTargets.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [mergeTargets, searchTerm])

    return (
        <div className={`p-4 rounded-xl border transition-all duration-200
            ${isSkipped ? 'bg-slate-900/30 border-slate-800 opacity-50' : 
              isCreated ? 'bg-purple-900/10 border-purple-500/50' :
              isMerged ? 'bg-blue-900/10 border-blue-500/50' :
              'bg-slate-900 border-slate-800 hover:border-slate-700'
            }
        `}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-200">{entity.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entity.desc || JSON.stringify(entity.info)}</p>
                </div>
                {decision && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase
                        ${isCreated ? 'bg-purple-500/20 text-purple-300' : 
                          isMerged ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}
                    `}>
                        {decision.action}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
                <button 
                    onClick={() => onDecision({ type: entity.type, name: entity.name, action: 'create' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors
                        ${isCreated 
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}
                    `}
                >
                    <Plus size={14} /> Create
                </button>
                
                <button 
                    onClick={() => onDecision({ type: entity.type, name: entity.name, action: 'merge', targetId: entity.name })} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors
                        ${isMerged 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}
                    `}
                >
                    <Merge size={14} /> Merge
                </button>

                <button 
                    onClick={() => onDecision({ type: entity.type, name: entity.name, action: 'skip' })}
                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center transition-colors
                        ${isSkipped 
                            ? 'bg-slate-700 text-white' 
                            : 'bg-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-700'}
                    `}
                >
                    <SkipForward size={14} />
                </button>
            </div>
            
            {/* Extended Options (Conditionals) */}
            {isCreated && entity.type === 'character' && (
                <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center gap-2 animate-in slide-in-from-top-1">
                    <span className="text-[10px] text-purple-300 font-bold uppercase">Grade:</span>
                    <select 
                        className="bg-slate-900 border border-purple-500/30 rounded text-xs text-purple-200 px-2 py-1 outline-none focus:border-purple-500"
                        onChange={(e) => onDecision({ type: entity.type, name: entity.name, action: 'create', grade: e.target.value as any })}
                        defaultValue={decision?.grade || 'EXTRA'}
                    >
                        <option value="MAIN">Main</option>
                        <option value="SUB">Sub</option>
                        <option value="MINOR">Minor</option>
                        <option value="EXTRA">Extra</option>
                    </select>
                </div>
            )}
            
            {/* Merge Dropdown / Search */}
            {isMerged && (
                <div className="mt-3 pt-3 border-t border-blue-500/20 animate-in slide-in-from-top-1 bg-slate-950/50 p-2 rounded-lg">
                   <div className="flex items-center gap-2 mb-2 border-b border-blue-500/20 pb-1">
                       <Search size={12} className="text-blue-400" />
                       <input 
                           type="text" 
                           placeholder="Search existing entity..." 
                           className="bg-transparent text-xs text-blue-200 w-full outline-none placeholder:text-blue-500/40"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                       />
                   </div>
                   
                   <div className="max-h-[100px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                       {filteredTargets.map(target => (
                           <button
                               key={target.id || target.name}
                               onClick={() => onDecision({ type: entity.type, name: entity.name, action: 'merge', targetId: target.name })}
                               className={`text-left text-xs px-2 py-1.5 rounded flex items-center justify-between transition-colors
                                   ${decision?.targetId === target.name 
                                       ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                                       : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                               `}
                           >
                               <span>{target.name}</span>
                               {decision?.targetId === target.name && <Check size={10} />}
                           </button>
                       ))}
                       {filteredTargets.length === 0 && (
                            <div className="text-[10px] text-slate-500 py-1 text-center">No matches found.</div>
                       )}
                   </div>
                   
                   {/* Manual Override (Hidden unless needed? Or just show input if search fails? Keeping it simple for now as requested) */}
                   {!mergeTargets.find(t => t.name === decision?.targetId) && decision?.targetId && (
                       <div className="mt-2 text-[10px] text-amber-500 px-2">
                           Selected: {decision.targetId} (New/Manual)
                       </div>
                   )}
                </div>
            )}

        </div>
    )
}
