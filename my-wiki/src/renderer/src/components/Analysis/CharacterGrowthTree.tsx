import { useState, useEffect, useMemo } from 'react'
import { CharacterBlueprint, GrowthCategory, DEFAULT_BLUEPRINT, GrowthNode, AxisLevel } from '../../../../shared/types/character-engine'
import { Hexagon, Lock, Save, Plus, Edit2 } from 'lucide-react'
import { ActBoard } from '../../types/plot'
import { GrowthNodeModal } from './GrowthNodeModal'
import { AxisModal } from './AxisModal'

interface CharacterGrowthTreeProps {
  characterId: string
  characterName: string
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const CharacterGrowthTree = ({ characterId, characterName }: CharacterGrowthTreeProps) => {
  const [blueprint, setBlueprint] = useState<CharacterBlueprint>(DEFAULT_BLUEPRINT)
  const [acts, setActs] = useState<ActBoard[]>([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<GrowthCategory>('identity')
  const [isDirty, setIsDirty] = useState(false)

  // Modal States
  const [nodeModal, setNodeModal] = useState<{
    isOpen: boolean,
    node?: GrowthNode,
    actNumber?: number,
    category?: string
  }>({ isOpen: false })

  const [axisModal, setAxisModal] = useState<{
    isOpen: boolean,
    axisName?: string,
    currentData?: AxisLevel
  }>({ isOpen: false })


  // Load Initial Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // @ts-ignore
        const [bpData, actsData] = await Promise.all([
           // @ts-ignore
           window.api.getCharacterBlueprint(characterId),
           // @ts-ignore
           window.api.getPlotData()
        ])

        if (bpData) {
            setBlueprint(bpData)
            // Ensure we have a valid active category
            const keys = Object.keys(bpData.axes)
            if (keys.length > 0 && !keys.includes(activeCategory)) {
                setActiveCategory(keys[0])
            }
        }
        if (actsData) setActs(actsData)
      } catch (err) {
        console.error('Failed to load engine data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [characterId])

  // Save Data
  const handleSave = async () => {
      try {
          // @ts-ignore
          const res = await window.api.saveCharacterBlueprint(blueprint)
          if (res.success) {
              setIsDirty(false)
              alert('Blueprint Saved & Synced to Wiki!')
          } else {
              alert('Save Failed: ' + res.message)
          }
      } catch (e) {
          console.error(e)
      }
  }

  // Filtering Nodes by Category
  const categoryNodes = useMemo(() => {
      // If no axes exist, showing nothing is safer
      if (!blueprint.axes[activeCategory]) return []
      return blueprint.nodes.filter(n => n.category === activeCategory)
  }, [blueprint.nodes, activeCategory])

  // --- Handlers ---

  const handleNodeSave = (nodeData: Partial<GrowthNode>) => {
    if (nodeData.id) {
        // Update existing
        setBlueprint(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === nodeData.id ? { ...n, ...nodeData } : n)
        }))
    } else {
        // Create new
        const newNode: GrowthNode = {
            id: generateId(),
            label: nodeData.label || 'New Node',
            description: nodeData.description || '',
            category: nodeData.category || activeCategory,
            act: nodeData.act || 1,
            status: nodeData.status || 'locked',
            levelRequirement: nodeData.levelRequirement || 1
        }
        setBlueprint(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
        }))
    }
    setIsDirty(true)
  }

  const handleNodeDelete = (nodeId: string) => {
    setBlueprint(prev => ({
        ...prev,
        nodes: prev.nodes.filter(n => n.id !== nodeId)
    }))
    setIsDirty(true)
  }

  const handleAxisSave = (name: string, data: AxisLevel) => {
      const isRename = axisModal.axisName && axisModal.axisName !== name

      setBlueprint(prev => {
          const newAxes = { ...prev.axes }
          
          if (isRename && axisModal.axisName) {
              delete newAxes[axisModal.axisName]
              // Also update nodes
              // Note: This is complex because we need to update categories of all nodes
              // For now, simpler implementation: just add new, keep old if mismatch? 
              // Better: migrate nodes.
          }
          
          newAxes[name] = data
          
          let newNodes = prev.nodes
          if (isRename && axisModal.axisName) {
              newNodes = prev.nodes.map(n => n.category === axisModal.axisName ? { ...n, category: name } : n)
          }

          return {
              ...prev,
              axes: newAxes,
              nodes: newNodes
          }
      })
      
      if (isRename || !axisModal.axisName) {
          setActiveCategory(name)
      }
      setIsDirty(true)
  }

  const handleAxisDelete = (name: string) => {
      setBlueprint(prev => {
          const newAxes = { ...prev.axes }
          delete newAxes[name]
          // Filter out nodes or keep them orphaned? Ideally filter.
          const newNodes = prev.nodes.filter(n => n.category !== name)
          
          return {
              ...prev,
              axes: newAxes,
              nodes: newNodes
          }
      })
      
      const remainingKeys = Object.keys(blueprint.axes).filter(k => k !== name)
      if (remainingKeys.length > 0) setActiveCategory(remainingKeys[0])
      
      setIsDirty(true)
  }


  if (loading) return <div className="p-8 text-cyan-500 animate-pulse">Initializing Engine...</div>

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] text-slate-300 relative">
      
      {/* Top Bar: Axis Summary */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
            <Hexagon size={20} />
            BLUEPRINT ENGINE
            </h2>
            <span className="text-xs text-slate-500 font-mono">{characterName}</span>
        </div>
        
        <div className="flex gap-4 items-center">
            {/* Axis Tabs */}
            {(Object.keys(blueprint.axes) as GrowthCategory[]).map(cat => (
                <div key={cat} className="relative group/axis">
                    <button
                        onClick={() => setActiveCategory(cat)}
                        className={`flex flex-col items-center px-4 py-1 rounded transition-all min-w-[80px] ${activeCategory === cat ? 'bg-cyan-900/30 border border-cyan-500/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-800/30 border border-transparent text-slate-600 hover:text-slate-400 opacity-60 hover:opacity-100'}`}
                    >
                        <span className="text-[10px] uppercase font-bold tracking-wider">{cat}</span>
                        <span className="text-lg font-mono font-bold text-white">{blueprint.axes[cat].current}<span className="text-slate-600 text-xs"> /{blueprint.axes[cat].max}</span></span>
                    </button>
                    {/* Edit Axis Button */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation()
                            setAxisModal({ isOpen: true, axisName: cat, currentData: blueprint.axes[cat] })
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-slate-800 rounded-full border border-slate-600 opacity-0 group-hover/axis:opacity-100 transition-opacity hover:bg-cyan-900 hover:text-cyan-400"
                    >
                        <Edit2 size={8} />
                    </button>
                </div>
            ))}
            
            {/* Add Axis Button */}
            <button 
                type="button"
                onClick={() => setAxisModal({ isOpen: true })}
                className="flex flex-col items-center justify-center w-[80px] h-[50px] border border-dashed border-slate-700 rounded hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all text-slate-600 hover:text-cyan-400 relative"
            >
                <Plus size={16} />
                <span className="text-[9px] mt-1 font-bold">ADD AXIS</span>
            </button>
        </div>

        <button 
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-xs transition-colors ${isDirty ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
            <Save size={14} /> SAVE
        </button>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0e14] to-[#050505] perspective-1000">
         {/* Background Grid */}
         <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
              style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
         />
         
         {/* Timeline / Act Markers (X-Axis) */}
         <div className="flex h-full min-w-max items-start px-12 pt-12 pb-24 relative z-10 gap-8">
             {acts.length === 0 && (
                 <div className="text-slate-500 p-8 italic">No timeline data found. Please ensure plot acts exist.</div>
             )}

             {acts.map((act) => {
                 const nodesInAct = categoryNodes.filter(n => n.act === act.actNumber);

                 return (
                    <div key={act.id} className="flex-shrink-0 w-[300px] h-full border-l border-slate-800/30 relative flex flex-col group">
                        {/* Act Header */}
                        <div className="absolute -top-6 left-2 text-xs font-bold text-slate-700 uppercase tracking-[0.2em] group-hover:text-cyan-500/50 transition-colors whitespace-nowrap">
                            {act.title}
                        </div>
                        
                        {/* Node Container */}
                        <div className="flex flex-col gap-12 items-center pt-8">
                            {nodesInAct.map(node => (
                                <div key={node.id} className="relative group/node">
                                    {/* Connection Line (Visual Mock) */}
                                    <div className="absolute top-1/2 -left-[160px] w-[160px] h-[1px] bg-slate-800 -z-10 hidden md:block" />

                                    {/* Node Circle */}
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNodeModal({ isOpen: true, node })
                                        }}
                                        className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer relative backdrop-blur-md z-20 group-hover/node:scale-105
                                            ${node.status === 'active' 
                                                ? 'border-cyan-500 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                                                : node.status === 'unlocked'
                                                    ? 'border-slate-500 bg-slate-800/40 hover:border-cyan-400/50'
                                                    : 'border-slate-800 bg-black/60 opacity-60 grayscale'
                                            }
                                        `}
                                    >
                                        {node.status === 'locked' && <Lock size={16} className="mb-1 text-slate-500" />}
                                        <span className={`text-[10px] font-bold text-center px-1 leading-tight ${node.status === 'active' ? 'text-cyan-100' : 'text-slate-400'}`}>
                                            {node.label}
                                        </span>
                                    </div>
                                    
                                    {/* Description Popup (Hover) */}
                                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-48 p-3 bg-black/90 border border-slate-700 rounded text-[10px] text-slate-400 opacity-0 group-hover/node:opacity-100 pointer-events-none transition-opacity z-50">
                                        {node.description || 'No description'}
                                    </div>
                                </div>
                            ))}

                            {/* Add Node Button */}
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNodeModal({ 
                                        isOpen: true, 
                                        actNumber: act.actNumber,
                                        category: activeCategory 
                                    })
                                }}
                                className="w-10 h-10 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600 hover:text-cyan-400 hover:border-cyan-500/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                 )
             })}
         </div>
      </div>
      
      {/* Footer */}
      <div className="h-12 border-t border-slate-800 bg-slate-950 flex items-center px-6 justify-between shrink-0">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
             Status: {isDirty ? 'Unsaved Changes' : 'Synced'}
          </span>
      </div>

      {/* Modals */}
      <GrowthNodeModal 
        isOpen={nodeModal.isOpen}
        node={nodeModal.node}
        actNumber={nodeModal.actNumber}
        category={nodeModal.category}
        onClose={() => setNodeModal({ isOpen: false })}
        onSave={handleNodeSave}
        onDelete={handleNodeDelete}
      />

      <AxisModal 
        isOpen={axisModal.isOpen}
        axisName={axisModal.axisName}
        currentData={axisModal.currentData}
        onClose={() => setAxisModal({ isOpen: false })}
        onSave={handleAxisSave}
        onDelete={handleAxisDelete}
      />
    </div>
  )
}
