import { useState, useEffect } from 'react'
import { X, Trash2, Check, Lock, Unlock, Activity, Ban } from 'lucide-react'
import { GrowthNode } from '../../../../shared/types/character-engine'

interface GrowthNodeModalProps {
  node?: GrowthNode // If null, we are creating a new node
  actNumber?: number // If creating, which act?
  category?: string // If creating, which category?
  tier?: number // If creating, which tier (horizontal level)?
  availableNodes?: GrowthNode[] // Other nodes in same act for prerequisite selection
  isOpen: boolean
  onClose: () => void
  onSave: (node: Partial<GrowthNode>) => void
  onDelete?: (nodeId: string) => void
}

export const GrowthNodeModal = ({ 
  node, 
  actNumber, 
  category,
  tier,
  availableNodes = [],
  isOpen, 
  onClose, 
  onSave, 
  onDelete 
}: GrowthNodeModalProps) => {
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<GrowthNode['status']>('locked')
  const [levelReq, setLevelReq] = useState(1)
  const [currentTier, setCurrentTier] = useState(1)
  const [prerequisites, setPrerequisites] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      if (node) {
        setLabel(node.label)
        setDescription(node.description || '')
        setStatus(node.status)
        setLevelReq(node.levelRequirement || 1)
        setCurrentTier(node.tier || 1)
        setPrerequisites(node.prerequisites || [])
      } else {
        setLabel('')
        setDescription('')
        setStatus('locked')
        setLevelReq(1)
        setCurrentTier(tier || 1)
        setPrerequisites([])
      }
    }
  }, [isOpen, node, tier])

  if (!isOpen) return null

  const handleSave = () => {
    if (!label.trim()) return alert('Label is required')
    
    onSave({
      id: node?.id, // undefined if new
      label,
      description,
      status,
      levelRequirement: levelReq,
      tier: currentTier,
      prerequisites,
      // If new, these need to be handled by parent or passed here
      act: node ? node.act : actNumber!,
      category: node ? node.category : category!
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[400px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h3 className="text-sm font-bold text-cyan-400">
            {node ? 'EDIT NODE' : 'NEW NODE'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          
          {/* Label */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Node Label</label>
            <input 
              type="text" 
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Sword Mastery"
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none placeholder-slate-700"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the achievement or event..."
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 h-24 resize-none focus:border-cyan-500 focus:outline-none custom-scrollbar placeholder-slate-700"
            />
          </div>

          {/* Tier (Horizontal Level) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">단계 (가로 위치)</label>
            <input 
              type="number" 
              min="1"
              max="10"
              value={currentTier}
              onChange={e => setCurrentTier(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
            <span className="text-[9px] text-slate-600">1=초기, 2=다음, 3=그 다음...</span>
          </div>

          {/* Prerequisites Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">
              선행 조건 (화살표 연결)
              {availableNodes.length > 0 && (
                <span className="ml-2 text-[8px] text-slate-600 normal-case">
                  ({availableNodes.filter(n => n.id !== node?.id).length}개 노드 사용 가능)
                </span>
              )}
            </label>
            {availableNodes.length > 0 ? (
              <>
                <div className="bg-slate-950 border border-slate-800 rounded p-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {availableNodes
                    .filter(n => n.id !== node?.id) // Don't show self
                    .map(availNode => (
                      <label key={availNode.id} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-900 rounded cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={prerequisites.includes(availNode.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPrerequisites([...prerequisites, availNode.id])
                            } else {
                              setPrerequisites(prerequisites.filter(id => id !== availNode.id))
                            }
                          }}
                          className="w-3 h-3"
                        />
                        <span className="text-xs text-slate-300">{availNode.label}</span>
                        <span className="text-[9px] text-slate-600 ml-auto">Tier {availNode.tier || 1}</span>
                      </label>
                    ))}
                  {availableNodes.filter(n => n.id !== node?.id).length === 0 && (
                    <span className="text-[9px] text-slate-600 italic">이 Act에 다른 노드가 없습니다</span>
                  )}
                </div>
                <span className="text-[9px] text-slate-600">
                  선택한 노드에서 화살표가 연결됩니다
                  {prerequisites.length > 0 && ` (${prerequisites.length}개 선택됨)`}
                </span>
              </>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded p-3 text-center">
                <span className="text-[9px] text-slate-600 italic">
                  이 Act에 선택 가능한 노드가 없습니다
                </span>
              </div>
            )}
          </div>

          {/* Status Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Status</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'locked', icon: Lock, label: 'Lock', color: 'text-slate-500' },
                { id: 'unlocked', icon: Unlock, label: 'Open', color: 'text-yellow-500' },
                { id: 'active', icon: Activity, label: 'Active', color: 'text-cyan-400' },
                { id: 'discarded', icon: Ban, label: 'Drop', color: 'text-red-500' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStatus(opt.id as any)}
                  className={`flex flex-col items-center justify-center p-2 rounded border transition-all
                    ${status === opt.id 
                      ? `bg-slate-800 border-cyan-500/50 shadow-[0_0_10px_rgba(0,0,0,0.3)]` 
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 opacity-60 hover:opacity-100'
                    }
                  `}
                >
                  <opt.icon size={16} className={`mb-1 ${opt.color}`} />
                  <span className="text-[9px] font-bold text-slate-400">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
          {node && onDelete ? (
             <button 
               onClick={() => {
                 if(window.confirm('Delete this node?')) {
                   onDelete(node.id)
                   onClose()
                 }
               }}
               className="text-red-900 hover:text-red-500 transition-colors"
             >
               <Trash2 size={16} />
             </button>
          ) : <div />}
          
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-1.5 rounded text-xs font-bold text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors"
            >
              CANCEL
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-1.5 rounded text-xs font-bold bg-cyan-700 text-cyan-100 hover:bg-cyan-600 shadow-lg shadow-cyan-900/20 flex items-center gap-2"
            >
              <Check size={14} />
              {node ? 'UPDATE' : 'CREATE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
