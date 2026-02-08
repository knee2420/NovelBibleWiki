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
    category?: string,
    tier?: number
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
            tier: nodeData.tier || 1,
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
                 
                 // 가로 레벨(tier)별로 그룹화 - 스킬 트리 형태
                 const tierGroups = new Map<number, GrowthNode[]>()
                 nodesInAct.forEach(node => {
                     const tier = node.tier || 1
                     if (!tierGroups.has(tier)) tierGroups.set(tier, [])
                     tierGroups.get(tier)!.push(node)
                 })
                 
                 const sortedTiers = Array.from(tierGroups.keys()).sort((a, b) => a - b)
                 const maxTier = sortedTiers.length > 0 ? Math.max(...sortedTiers) : 0

                 return (
                    <div key={act.id} className="flex-shrink-0 min-w-max h-full border-l border-slate-800/30 relative flex flex-col group px-6">
                        {/* Act Header */}
                        <div className="absolute -top-6 left-2 text-xs font-bold text-slate-700 uppercase tracking-[0.2em] group-hover:text-cyan-500/50 transition-colors whitespace-nowrap">
                            {act.title}
                        </div>
                        
                        {/* SVG Connection Layer - Positioned absolutely to draw arrows */}
                        <svg 
                            className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                            style={{ zIndex: 10 }}
                        >
                            {nodesInAct.map(node => {
                                const prereqNodes = (node.prerequisites || [])
                                    .map(id => nodesInAct.find(n => n.id === id))
                                    .filter(Boolean) as GrowthNode[]
                                
                                const isActivePath = (node.status === 'active' || node.status === 'unlocked')
                                
                                return prereqNodes.map(prereqNode => {
                                    const bothActive = isActivePath && 
                                        (prereqNode.status === 'active' || prereqNode.status === 'unlocked')
                                    
                                    // Calculate positions based on tier
                                    const prereqTier = prereqNode.tier || 1
                                    const nodeTier = node.tier || 1
                                    
                                    // Get node positions within their tier groups
                                    const prereqIndex = tierGroups.get(prereqTier)!.findIndex(n => n.id === prereqNode.id)
                                    const nodeIndex = tierGroups.get(nodeTier)!.findIndex(n => n.id === node.id)
                                    
                                    // Layout constants matching CSS
                                    const tierWidth = 120 // min-w-[120px]
                                    const tierGap = 64 // gap-16
                                    const nodeSize = 80 // w-20 h-20 = 5rem
                                    const nodeGap = 32 // gap-8
                                    const tierLabelHeight = 40 // tier label + mb-2
                                    const topPadding = 32 // pt-8
                                    const leftPadding = 24 // px-6
                                    
                                    // Calculate center positions
                                    const prereqX = leftPadding + (prereqTier - 1) * (tierWidth + tierGap) + tierWidth / 2
                                    const prereqY = topPadding + tierLabelHeight + prereqIndex * (nodeSize + nodeGap) + nodeSize / 2
                                    
                                    const nodeX = leftPadding + (nodeTier - 1) * (tierWidth + tierGap) + tierWidth / 2
                                    const nodeY = topPadding + tierLabelHeight + nodeIndex * (nodeSize + nodeGap) + nodeSize / 2
                                    
                                    // Edge points (on circle perimeter)
                                    const radius = nodeSize / 2
                                    const angle = Math.atan2(nodeY - prereqY, nodeX - prereqX)
                                    
                                    const x1 = prereqX + Math.cos(angle) * radius
                                    const y1 = prereqY + Math.sin(angle) * radius
                                    const x2 = nodeX - Math.cos(angle) * radius
                                    const y2 = nodeY - Math.sin(angle) * radius
                                    
                                    // Create bezier curve path
                                    const dx = x2 - x1
                                    const controlPoint1X = x1 + dx * 0.5
                                    const controlPoint1Y = y1
                                    const controlPoint2X = x1 + dx * 0.5
                                    const controlPoint2Y = y2
                                    
                                    const pathD = `M ${x1} ${y1} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${x2} ${y2}`
                                    
                                    return (
                                        <g key={`${prereqNode.id}-${node.id}`}>
                                            {/* Glow effect for active paths */}
                                            {bothActive && (
                                                <path
                                                    d={pathD}
                                                    stroke="#06b6d4"
                                                    strokeWidth="6"
                                                    fill="none"
                                                    opacity="0.2"
                                                    className="animate-pulse"
                                                />
                                            )}
                                            {/* Main arrow path */}
                                            <path
                                                d={pathD}
                                                stroke={bothActive ? '#06b6d4' : '#475569'}
                                                strokeWidth={bothActive ? '2.5' : '1.5'}
                                                fill="none"
                                                markerEnd={`url(#arrowhead-${bothActive ? 'active' : 'inactive'})`}
                                                className="transition-all duration-300"
                                            />
                                        </g>
                                    )
                                })
                            })}
                            
                            {/* Arrow markers */}
                            <defs>
                                <marker
                                    id="arrowhead-active"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3, 0 6" fill="#06b6d4" />
                                </marker>
                                <marker
                                    id="arrowhead-inactive"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3, 0 6" fill="#475569" />
                                </marker>
                            </defs>
                        </svg>
                        
                        {/* Skill Tree Container - 가로로 펼쳐지는 구조 */}
                        <div className="flex gap-16 items-start pt-8 h-full relative" style={{ zIndex: 20 }}>
                            {sortedTiers.map((tier) => (
                                <div key={tier} className="flex flex-col gap-6 min-w-[120px] relative group/tier">
                                    
                                    {/* Tier Label */}
                                    <div className="text-[9px] uppercase font-bold text-slate-700 tracking-wider text-center mb-2">
                                        {tier === 1 ? '초기' : `${tier}단계`}
                                    </div>
                                    
                                     {/* Nodes in this tier - 세로로 배치 */}
                                    <div className="flex flex-col gap-8 items-center relative">
                                        {tierGroups.get(tier)!.map((node) => {
                                            // Find prerequisite nodes
                                            const prereqNodes = (node.prerequisites || [])
                                                .map(id => nodesInAct.find(n => n.id === id))
                                                .filter(Boolean) as GrowthNode[]
                                            
                                            return (
                                            <div key={node.id} className="relative group/node"  data-node-id={node.id}>

                                                {/* Node Circle */}
                                                <div 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNodeModal({ isOpen: true, node, tier: node.tier })
                                                    }}
                                                    className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer relative backdrop-blur-md z-20 group-hover/node:scale-110
                                                        ${node.status === 'active' 
                                                            ? 'border-cyan-500 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                                                            : node.status === 'unlocked'
                                                                ? 'border-yellow-500 bg-yellow-950/40 hover:border-yellow-400'
                                                                : node.status === 'discarded'
                                                                    ? 'border-red-800 bg-red-950/20 opacity-40'
                                                                    : 'border-slate-800 bg-black/60 opacity-60'
                                                        }
                                                    `}
                                                >
                                                    {node.status === 'locked' && <Lock size={14} className="mb-1 text-slate-600" />}
                                                    <span className={`text-[9px] font-bold text-center px-2 leading-tight ${
                                                        node.status === 'active' ? 'text-cyan-100' : 
                                                        node.status === 'unlocked' ? 'text-yellow-200' :
                                                        'text-slate-500'
                                                    }`}>
                                                        {node.label}
                                                    </span>
                                                </div>
                                                
                                                {/* Description Tooltip */}
                                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 p-3 bg-black/95 border border-slate-700 rounded text-[9px] text-slate-300 opacity-0 group-hover/node:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                                                    <div className="font-bold text-cyan-400 mb-1">{node.label}</div>
                                                    {node.description || 'No description'}
                                                    {prereqNodes.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-slate-700 text-[8px] text-slate-500">
                                                            필요: {prereqNodes.map(p => p.label).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )})}
                                        
                                        
                                        {/* Add Node to This Tier */}
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setNodeModal({ 
                                                    isOpen: true, 
                                                    actNumber: act.actNumber,
                                                    category: activeCategory,
                                                    tier: tier
                                                })
                                            }}
                                            className="w-8 h-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600 hover:text-cyan-400 hover:border-cyan-500/50 transition-all opacity-0 group-hover/tier:opacity-100 cursor-pointer"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Add New Tier (Next Level) */}
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNodeModal({ 
                                        isOpen: true, 
                                        actNumber: act.actNumber,
                                        category: activeCategory,
                                        tier: maxTier + 1
                                    })
                                }}
                                className="flex flex-col items-center justify-center min-w-[80px] h-32 border-2 border-dashed border-slate-800/50 rounded-lg text-slate-700 hover:text-cyan-500 hover:border-cyan-500/30 transition-all opacity-0 group-hover:opacity-100 cursor-pointer mt-12"
                            >
                                <Plus size={16} className="mb-1" />
                                <span className="text-[9px] font-bold">다음<br/>단계</span>
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
        tier={nodeModal.tier}
        availableNodes={categoryNodes.filter(n => n.act === (nodeModal.node?.act || nodeModal.actNumber))}
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
