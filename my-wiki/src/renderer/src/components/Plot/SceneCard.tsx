import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { FileText, Tag, PenTool } from 'lucide-react'
import { SceneCard as SceneCardType } from '../../types/plot'

interface Props {
  scene: SceneCardType
  index: number
  onClick: (id: string) => void
}

export const SceneCard = ({ scene, index, onClick }: Props) => {
  return (
    <Draggable draggableId={scene.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(scene.id)}
          style={{ ...provided.draggableProps.style }}
          className={`
            group bg-slate-800 border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all
            ${snapshot.isDragging ? 'border-blue-500 shadow-xl shadow-blue-500/20 rotate-2 z-50' : 'border-slate-700 hover:border-slate-500'}
          `}
        >
          {/* Header: Scene Number & Icon */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/50 px-1.5 py-0.5 rounded">
              SCENE {scene.sceneNumber}
            </span>
            {scene.isScripted ? (
              <FileText className="w-3 h-3 text-emerald-500" />
            ) : (
              <PenTool className="w-3 h-3 text-amber-500" />
            )}
          </div>

          {/* Title */}
          <h4 className="font-bold text-slate-200 text-sm mb-2 leading-snug">
            {scene.title}
          </h4>

          {/* Body: 4줄 요약 (요청사항 반영) */}
          <p className="text-xs text-slate-400 mb-3 leading-relaxed line-clamp-4 min-h-[4.5em]">
            {scene.summary}
          </p>

          {/* Footer: Tags */}
          <div className="flex flex-wrap gap-1">
            {scene.characters.slice(0, 3).map((char, i) => {
              const safeChar = typeof char === 'string' ? char : String(char || '')
              return (
                <span
                  key={i}
                  className="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700/50 flex items-center gap-1"
                >
                  <Tag className="w-2 h-2 opacity-50" />
                  {safeChar.replace(/\[\[|\]\]/g, '')}
                </span>
              )
            })}
            {scene.characters.length > 3 && (
              <span className="text-[9px] text-slate-600 px-1">+{scene.characters.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
