// Character Scene List - Shows all scenes where a character appears
import { useState, useEffect } from 'react'
import { Check, ExternalLink } from 'lucide-react'

interface SceneInfo {
  id: string
  fileName: string
  chapterNumber?: number // [NEW] From frontmatter
  sceneNumber: number
  title: string
  summary: string
  chapterTitle?: string
  actTitle?: string
}

interface CharacterSceneListProps {
  characterName: string
  aliases?: string[]
  selectedScenes: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onOpenScene?: (sceneId: string) => void
}

export const CharacterSceneList = ({
  characterName,
  aliases = [],
  selectedScenes,
  onSelectionChange,
  onOpenScene
}: CharacterSceneListProps) => {
  const [scenes, setScenes] = useState<SceneInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCharacterScenes()
  }, [characterName])

  const loadCharacterScenes = async () => {
    setLoading(true)
    setError(null)

    try {
      // @ts-ignore
      const result = await window.api.getCharacterScenes(characterName, aliases)
      
      if (!result.success) {
        setError(result.error || '씬 목록을 불러올 수 없습니다.')
        setScenes([])
        return
      }

      setScenes(result.scenes || [])
    } catch (err) {
      console.error('Failed to load character scenes:', err)
      setError(String(err))
      setScenes([])
    } finally {
      setLoading(false)
    }
  }

  const toggleScene = (sceneId: string) => {
    if (selectedScenes.includes(sceneId)) {
      onSelectionChange(selectedScenes.filter(id => id !== sceneId))
    } else {
      onSelectionChange([...selectedScenes, sceneId])
    }
  }

  const selectAll = () => {
    onSelectionChange(scenes.map(s => s.id))
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-20 bg-slate-900/50 animate-pulse rounded-lg"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {error}
      </div>
    )
  }

  if (scenes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 italic border border-dashed border-slate-800 rounded-lg">
        <p>이 캐릭터가 등장하는 씬이 없습니다.</p>
        <p className="text-xs mt-2">씬의 frontmatter에 wiki-data.appear 필드를 추가해주세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Selection Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-xs text-slate-500">
          {selectedScenes.length} / {scenes.length} 선택됨
        </span>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            전체 선택
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            선택 해제
          </button>
        </div>
      </div>

      {/* Scene Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        {scenes.map(scene => {
          const isSelected = selectedScenes.includes(scene.id)

          return (
            <div
              key={scene.id}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer group
                ${isSelected 
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-sm' 
                  : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }
              `}
              onClick={() => toggleScene(scene.id)}
            >
              {/* Checkbox - Top Right */}
              <div className="absolute top-2 right-2">
                <div
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-slate-600 group-hover:border-slate-500'
                    }
                  `}
                >
                  {isSelected && <Check size={14} className="text-white" />}
                </div>
              </div>

              {/* Scene Info */}
              <div className="pr-6">
                {/* Chapter-Scene Badge */}
                <div className="flex items-center gap-1.5 mb-2">
                  {scene.chapterNumber !== undefined && scene.chapterNumber > 0 && (
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      CH {scene.chapterNumber}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                    SC {scene.sceneNumber}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-slate-200 mb-2 line-clamp-2 leading-tight">
                  {scene.title}
                </h4>

                {/* Context */}
                {(scene.actTitle || scene.chapterTitle) && (
                  <div className="text-[9px] text-slate-500 mb-1.5 line-clamp-1">
                    {scene.actTitle && <span>{scene.actTitle}</span>}
                    {scene.actTitle && scene.chapterTitle && <span className="mx-1">›</span>}
                    {scene.chapterTitle && <span>{scene.chapterTitle}</span>}
                  </div>
                )}

                {/* Summary */}
                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                  {scene.summary || '요약 없음'}
                </p>
              </div>

              {/* Open Scene Button - Bottom Right */}
              {onOpenScene && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenScene(scene.id)
                  }}
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded"
                  title="씬 열기"
                >
                  <ExternalLink size={12} className="text-slate-500" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
