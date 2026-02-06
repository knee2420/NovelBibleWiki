
import React, { useState } from 'react'
import { Plus, Trash2, ChevronRight, ChevronDown, GripVertical } from 'lucide-react'
import { SchemaProperty, SchemaType } from '../../../../shared/types/schema-config'

interface SchemaBuilderProps {
  root: SchemaProperty
  onChange: (newRoot: SchemaProperty) => void
}

// Helper to generate unique ID
const generateId = () => `node_${Math.random().toString(36).substr(2, 9)}`

export const SchemaBuilder = ({ root, onChange }: SchemaBuilderProps) => {
  
  // Recursively update a node by ID
  const updateNodeRec = (node: SchemaProperty, targetId: string, changes: Partial<SchemaProperty>): SchemaProperty => {
    if (node.id === targetId) {
      return { ...node, ...changes }
    }
    
    // Process children (properties)
    if (node.properties) {
      return {
        ...node,
        properties: node.properties.map(p => updateNodeRec(p, targetId, changes))
      }
    }
    
    // Process items (array)
    if (node.items) {
      return {
        ...node,
        items: updateNodeRec(node.items, targetId, changes)
      }
    }
    return node
  }

  // Recursively add a child property
  const addChildRec = (node: SchemaProperty, parentId: string): SchemaProperty => {
    if (node.id === parentId) {
        const newProp: SchemaProperty = {
            id: generateId(),
            key: 'new_field',
            type: 'string',
            description: ''
        }
        return {
            ...node,
            properties: [...(node.properties || []), newProp]
        }
    }
    
    // Recurse
    if (node.properties) {
        return { ...node, properties: node.properties.map(p => addChildRec(p, parentId)) }
    }
    if (node.items) {
        return { ...node, items: addChildRec(node.items, parentId) }
    }
    return node
  }

  // Recursively remove a node
  const removeNodeRec = (node: SchemaProperty, targetId: string): SchemaProperty => {
      // NOTE: This logic assumes 'node' is the PARENT processing its children
      // But we call from Root. So we need to filter children.
      
      if (node.properties) {
          return {
              ...node,
              properties: node.properties
                .filter(p => p.id !== targetId)
                .map(p => removeNodeRec(p, targetId))
          }
      }
      
      if (node.items) {
          // You can't really "remove" the Item definition of an array, only reset it?
          // Or if strict, Array MUST have items.
          return {
              ...node,
              items: node.items.id === targetId ? node.items : removeNodeRec(node.items, targetId)
          }
      }
      return node
  }

  const handleUpdate = (id: string, changes: Partial<SchemaProperty>) => {
      // Logic for type change: if changing to Object, init properties. If Array, init items.
      if (changes.type === 'object' && !changes.properties) changes.properties = []
      if (changes.type === 'array' && !changes.items) {
          changes.items = { id: generateId(), key: 'item', type: 'string' }
      }
      
      onChange(updateNodeRec(root, id, changes))
  }

  const handleAddStart = (parentId: string) => {
      onChange(addChildRec(root, parentId))
  }

  const handleRemove = (id: string) => {
      onChange(removeNodeRec(root, id))
  }

  return (
    <div className="text-sm font-sans text-slate-300">
        <SchemaRow 
            node={root} 
            isRoot={true} 
            onUpdate={handleUpdate} 
            onAdd={handleAddStart} 
            onRemove={handleRemove}
            depth={0}
        />
    </div>
  )
}

interface SchemaRowProps {
    node: SchemaProperty
    isRoot?: boolean
    onUpdate: (id: string, changes: Partial<SchemaProperty>) => void
    onAdd: (parentId: string) => void
    onRemove: (id: string) => void
    depth: number
}

const SchemaRow = ({ node, isRoot, onUpdate, onAdd, onRemove, depth }: SchemaRowProps) => {
    const [expanded, setExpanded] = useState(true)
    const isContainer = node.type === 'object' || node.type === 'array'

    return (
        <div className="flex flex-col relative">
             {/* Indentation Guide Line (Vertical) - Only for children */}
             {!isRoot && (
                <div 
                    className="absolute border-l border-slate-700/50" 
                    style={{ left: `${depth * 24 - 14}px`, top: 0, bottom: 0 }}
                />
            )}

            {/* The Row Itself */}
            <div className={`flex items-center gap-2 py-2.5 border-b border-slate-800 hover:bg-slate-800/80 transition-colors pr-2 group
                ${isRoot ? 'bg-slate-800/50 rounded-t-lg mb-1' : ''}`}
                style={{ paddingLeft: `${depth * 24 + 8}px` }}
            >
                {/* Expander Arrow */}
                <button 
                   onClick={() => setExpanded(!expanded)} 
                   className={`w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-all ${isContainer ? '' : 'invisible'} ${expanded ? 'rotate-0' : '-rotate-90'}`}
                >
                   <ChevronDown size={14} strokeWidth={3} />
                </button>

                {/* Key Input */}
                <div className="relative">
                    <input 
                        value={node.key}
                        disabled={isRoot} 
                        onChange={(e) => onUpdate(node.id, { key: e.target.value })}
                        className={`bg-[#0b0c15] border border-slate-700 hover:border-blue-500/50 focus:border-blue-500 rounded px-2 py-1 text-sm font-semibold font-mono w-48 text-blue-100 focus:outline-none transition-all shadow-sm ${isRoot ? 'opacity-80' : ''}`}
                        placeholder="속성 이름 (Key)"
                    />
                </div>

                <span className="text-slate-500 font-bold px-1">:</span>

                {/* Type Select */}
                <div className="relative">
                    <select 
                        value={node.type}
                        onChange={(e) => onUpdate(node.id, { type: e.target.value as SchemaType })}
                        className="appearance-none bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded px-3 py-1 text-[11px] font-bold text-amber-400 focus:outline-none focus:bg-slate-800 cursor-pointer w-28 uppercase tracking-wide text-center shadow-sm"
                    >
                        <option value="string">문자열</option>
                        <option value="number">숫자</option>
                        <option value="boolean">불리언</option>
                        <option value="object">객체</option>
                        <option value="array">배열</option>
                    </select>
                </div>

                {/* Description Input */}
                <input 
                    value={node.description || ''}
                    onChange={(e) => onUpdate(node.id, { description: e.target.value })}
                    className="flex-1 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-slate-500 text-xs text-slate-300 focus:text-white focus:outline-none px-3 py-1.5 min-w-[150px] placeholder:text-slate-600 transition-colors"
                    placeholder="AI를 위한 상세 설명..."
                />

                {/* Enum Input - Only for String */}
                {node.type === 'string' && (
                    <input 
                        value={node.enum?.join(', ') || ''}
                        onChange={(e) => {
                            const val = e.target.value
                            const enums = val.split(',').map(s => s.trim()).filter(s => s.length > 0)
                            onUpdate(node.id, { enum: enums.length > 0 ? enums : undefined })
                        }}
                        className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-amber-500/50 text-[11px] text-amber-500/80 focus:text-amber-400 focus:outline-none px-2 py-1.5 min-w-[120px] max-w-[200px] placeholder:text-slate-700 transition-colors text-right font-mono"
                        placeholder="Enum (Option1, Option2...)"
                    />
                )}

                {/* Array Item Label Hint */}
                {node.type === 'array' && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap">
                        목록 요소 (List of...)
                    </span>
                )}

                {/* Actions - Always visible but dimmed */}
                <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity pl-2 border-l border-slate-800 ml-2">
                    {node.type === 'object' && (
                        <button onClick={() => onAdd(node.id)} className="p-1.5 text-slate-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-colors" title="속성 추가">
                            <Plus size={14} strokeWidth={2.5} />
                        </button>
                    )}
                    {!isRoot && (
                        <button onClick={() => onRemove(node.id)} className="p-1.5 text-slate-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors" title="삭제">
                            <Trash2 size={14} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>

            {/* Children Container */}
            {expanded && (
                <div className="">
                    {node.type === 'object' && node.properties?.map(prop => (
                        <SchemaRow 
                            key={prop.id} 
                            node={prop} 
                            onUpdate={onUpdate} 
                            onAdd={onAdd} 
                            onRemove={onRemove}
                            depth={depth + 1}
                        />
                    ))}
                    
                    {node.type === 'array' && node.items && (
                        <div className="relative">
                            <SchemaRow 
                                node={node.items} 
                                onUpdate={onUpdate} 
                                onAdd={onAdd}
                                onRemove={onRemove}
                                depth={depth + 1}
                            />
                        </div>
                    )}
                </div>
            )}
            
            {/* Empty State for Object */}
            {expanded && node.type === 'object' && (!node.properties || node.properties.length === 0) && (
                 <div className="py-3 text-xs text-slate-500 italic select-none flex items-center gap-2" style={{ paddingLeft: `${(depth + 1) * 24 + 10}px` }}>
                     <span>속성이 없습니다.</span>
                     <button onClick={() => onAdd(node.id)} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1">
                        <Plus size={12} /> 추가하기
                     </button>
                 </div>
            )}
        </div>
    )
}
