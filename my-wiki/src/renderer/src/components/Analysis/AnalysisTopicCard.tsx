// Analysis Topic Card - Display and edit individual analysis topics
import { useState } from 'react'
import { Edit2, Trash2, Save, X, Calendar, FileText } from 'lucide-react'
import { CharacterAnalysisTopic } from '../../types/analysis-schema'

interface AnalysisTopicCardProps {
  topic: CharacterAnalysisTopic
  onUpdate: (topicId: string, data: Partial<CharacterAnalysisTopic>) => Promise<{ success: boolean; error?: string }>
  onDelete: (topicId: string) => Promise<{ success: boolean; error?: string }>
}

export const AnalysisTopicCard = ({ topic, onUpdate, onDelete }: AnalysisTopicCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(topic.data)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const result = await onUpdate(topic.id, { data: editData })
    setIsSaving(false)

    if (result.success) {
      setIsEditing(false)
    } else {
      alert(`저장 실패: ${result.error}`)
    }
  }

  const handleCancel = () => {
    setEditData(topic.data)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('이 분석 주제를 삭제하시겠습니까?')) return

    const result = await onDelete(topic.id)
    if (!result.success) {
      alert(`삭제 실패: ${result.error}`)
    }
  }

  const handleFieldChange = (key: string, value: any) => {
    setEditData(prev => ({ ...prev, [key]: value }))
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSchemaColor = (schemaName: string): string => {
    if (schemaName.includes('결핍')) return 'pink'
    if (schemaName.includes('TKI')) return 'blue'
    if (schemaName.includes('D&D')) return 'purple'
    if (schemaName.includes('성장')) return 'green'
    if (schemaName.includes('방어')) return 'orange'
    if (schemaName.includes('신념')) return 'cyan'
    if (schemaName.includes('동기')) return 'yellow'
    return 'slate'
  }

  const color = getSchemaColor(topic.schemaName)

  const colorClasses = {
    pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    slate: 'bg-slate-500/10 border-slate-500/30 text-slate-400'
  }[color]

  return (
    <div className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden group hover:border-slate-700 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full border text-xs font-bold ${colorClasses}`}>
            {topic.schemaName}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={12} />
            <span>{formatDate(topic.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
                title="취소"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-1.5 rounded hover:bg-blue-600 text-blue-400 hover:text-white transition-colors disabled:opacity-50"
                title="저장"
              >
                {isSaving ? '...' : <Save size={16} />}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all"
                title="수정"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                title="삭제"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {Object.entries((isEditing ? editData : topic.data) || {}).map(([key, value]) => {
          // Handle different data types
          if (key === 'autopsy_scenes' && Array.isArray(value)) {
            return (
              <div key={key} className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </label>
                <div className="space-y-2">
                  {value.map((scene: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950/50 rounded border border-slate-800 text-xs space-y-1">
                      {Object.entries(scene).map(([sceneKey, sceneValue]) => (
                        <div key={sceneKey}>
                          <span className="text-slate-500">{sceneKey}: </span>
                          <span className="text-slate-300">{String(sceneValue)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <div key={key} className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {key.replace(/_/g, ' ')}
              </label>
              {isEditing ? (
                <textarea
                  value={String(value)}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-blue-500 outline-none resize-none min-h-[60px]"
                />
              ) : (
                <div className="prose prose-sm prose-invert prose-slate max-w-none">
                  {typeof value === 'object' && value !== null ? (
                    <pre className="text-xs bg-slate-950 p-3 rounded border border-slate-800 text-slate-400 overflow-x-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{String(value)}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Scene References */}
        {topic.sceneIds.length > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileText size={12} />
              <span>분석에 사용된 씬: {topic.sceneIds.length}개</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
