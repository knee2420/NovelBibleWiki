import { useState, useEffect } from 'react'
import { X, Check, Trash2 } from 'lucide-react'
import { AxisLevel } from '../../../../shared/types/character-engine'

interface AxisModalProps {
  axisName?: string // If null, creating new
  currentData?: AxisLevel
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, data: AxisLevel) => void
  onDelete?: (name: string) => void
}

export const AxisModal = ({ 
  axisName, 
  currentData, 
  isOpen, 
  onClose, 
  onSave,
  onDelete
}: AxisModalProps) => {
  const [name, setName] = useState('')
  const [current, setCurrent] = useState(1)
  const [max, setMax] = useState(5)

  useEffect(() => {
    if (isOpen) {
      if (axisName && currentData) {
        setName(currentData.label || axisName)
        setCurrent(currentData.current)
        setMax(currentData.max)
      } else {
        setName('')
        setCurrent(1)
        setMax(5)
      }
    }
  }, [isOpen, axisName, currentData])

  if (!isOpen) return null

  const handleSave = () => {
    if (!name.trim()) return alert('Name is required')
    
    // Validate
    const safeCurrent = Math.max(0, Math.min(current, max))
    
    onSave(name, {
      current: safeCurrent,
      max: max,
      label: name
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[300px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h3 className="text-sm font-bold text-cyan-400">
            {axisName ? 'EDIT AXIS' : 'NEW AXIS'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Axis Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Strength, Karma"
              // Disable name editing if it's a key (simplification for now, or allow rename with complexity)
              // Let's allow rename but it will require parent to handle key change. 
              // For now, assume simplified flow.
              className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none placeholder-slate-700"
              autoFocus
            />
          </div>

          <div className="flex gap-4">
             <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Current</label>
                <input 
                  type="number" 
                  min="0"
                  max={max}
                  value={current}
                  onChange={e => setCurrent(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none center-input"
                />
             </div>
             <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Max</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={max}
                  onChange={e => setMax(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none center-input"
                />
             </div>
          </div>

        </div>

        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
          {axisName && onDelete ? (
             <button 
               onClick={() => {
                 if(window.confirm(`Delete axis '${axisName}'? This will hide nodes in this category.`)) {
                    onDelete(axisName)
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
              SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
