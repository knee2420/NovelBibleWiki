import { useState } from 'react'
import { WikiEntry } from '../../types/wiki'
import { X, Edit2, Save, XCircle, Tag, FileText, Layout } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface WikiDetailModalProps {
  entry: WikiEntry
  onClose: () => void
  onUpdate?: () => void // 저장 후 데이터 갱신 콜백
}

export const WikiDetailModal = ({ entry, onClose, onUpdate }: WikiDetailModalProps) => {
  // --- View Mode Data ---
  // (초기 데이터는 entry에서 옴)

  // --- Edit Mode State ---
  const [isEditing, setIsEditing] = useState(false)

  const [editTitle, setEditTitle] = useState(entry.name)
  const [editType, setEditType] = useState(entry.type)
  const [editContent, setEditContent] = useState(entry.content || '')
  const [editTags, setEditTags] = useState(entry.tags?.join(', ') || '') // 태그를 문자열로 관리

  // --- Handlers ---
  const handleSave = async () => {
    try {
      // 태그 문자열 -> 배열 변환
      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t !== '')

      // @ts-ignore
      const result = await window.api.saveWikiEntry({
        id: entry.id, // 파일 경로(ID)는 불변
        title: editTitle,
        type: editType,
        tags: tagsArray,
        content: editContent
      })

      if (result.success) {
        setIsEditing(false)
        if (onUpdate) onUpdate() // 상위 컴포넌트에 갱신 요청
        // alert('저장되었습니다.') // UX 흐름상 생략 가능
      } else {
        alert('저장 실패: ' + result.message)
      }
    } catch (error) {
      console.error('Save Error:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = () => {
    // 변경 사항 취소하고 원래 데이터로 리셋
    setEditTitle(entry.name)
    setEditType(entry.type)
    setEditContent(entry.content || '')
    setEditTags(entry.tags?.join(', ') || '')
    setIsEditing(false)
  }

  if (!entry) return null

  // Draft 판별 (UI 표시용)
  const isDraft = entry.id.includes('00_Draft')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex overflow-hidden">
        {/* --- Left Column: Image & Meta (Fixed width) --- */}
        <div className="w-80 bg-slate-950 flex flex-col border-r border-slate-800 flex-shrink-0">
          {/* Image Area */}
          <div className="aspect-[3/4] w-full bg-black/50 relative overflow-hidden group">
            {entry.image ? (
              <img
                src={entry.image}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700">
                NO IMAGE
              </div>
            )}

            {/* Draft Badge */}
            {isDraft && (
              <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded shadow">
                DRAFT
              </div>
            )}
          </div>

          {/* Meta Info Area */}
          <div className="p-5 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Type Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                <Layout size={10} /> Type
              </label>
              {isEditing ? (
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:border-blue-500 outline-none"
                >
                  <option value="character">Character</option>
                  <option value="item">Item</option>
                  <option value="location">Location</option>
                  <option value="faction">Faction</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <div className="text-blue-400 font-bold uppercase text-sm border border-blue-500/30 bg-blue-500/10 px-2 py-1 rounded inline-block">
                  {editType}
                </div>
              )}
            </div>

            {/* Tags Field */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                <Tag size={10} /> Tags
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="콤마(,)로 구분 (예: 주요인물, 강함)"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:border-blue-500 outline-none"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags && entry.tags.length > 0 ? (
                    entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600">- No Tags -</span>
                  )}
                </div>
              )}
            </div>

            {/* Info (Read-only for now) */}
            {!isEditing && Object.keys(entry.info || {}).length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-900">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Metadata
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(entry.info || {}).map(([key, value]) => {
                    // title, type, tags, date 등은 제외하고 보여주기
                    if (['title', 'type', 'tags', 'created', 'updated'].includes(key)) return null
                    return (
                      <div
                        key={key}
                        className="flex justify-between text-xs border-b border-slate-800/50 pb-1"
                      >
                        <span className="text-slate-500 capitalize">{key}</span>
                        <span className="text-slate-300 font-medium truncate max-w-[120px] text-right">
                          {String(value)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Right Column: Content Editor/Viewer --- */}
        <div className="flex-1 flex flex-col bg-[#0b0e14]">
          {/* Header (Title & Actions) */}
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-transparent text-2xl font-bold text-white border-b border-blue-500 focus:outline-none w-full mr-4 px-1 pb-1"
                placeholder="문서 제목"
                autoFocus
              />
            ) : (
              <h1 className="text-2xl font-bold text-slate-100 truncate pr-4">{entry.name}</h1>
            )}

            <div className="flex items-center gap-2 flex-shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <XCircle size={14} /> 취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <Save size={14} /> 저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
                  >
                    <Edit2 size={14} /> 수정
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full min-h-[500px] bg-transparent text-slate-300 text-sm leading-relaxed focus:outline-none resize-none font-mono"
                placeholder="# 내용을 입력하세요..."
              />
            ) : (
              <div className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-200 prose-a:text-blue-400">
                {/* 마크다운 렌더링 */}
                <ReactMarkdown>{entry.content || ''}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Footer Status */}
          <div className="h-8 border-t border-slate-800 flex items-center px-4 text-[10px] text-slate-500 bg-slate-950 select-none">
            <FileText size={10} className="mr-1.5" />
            <span className="truncate">{entry.id}</span>
            <span className="mx-2">•</span>
            <span>{isEditing ? 'Editing...' : 'Read Only'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
