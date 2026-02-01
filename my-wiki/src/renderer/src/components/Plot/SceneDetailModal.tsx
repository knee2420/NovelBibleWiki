import { useEffect, useState, useRef } from 'react'
import { X, User, MapPin, FileText, Tag, Edit2, Save, XCircle, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SceneDetailModalProps {
  filePath: string
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void // 데이터 갱신 요청 콜백 (PlotDashboard에서 넘겨줘야 함)
}

export const SceneDetailModal = ({
  filePath,
  isOpen,
  onClose,
  onUpdate
}: SceneDetailModalProps) => {
  const [loading, setLoading] = useState(false)

  // --- Data State ---
  const [originalData, setOriginalData] = useState<any>(null) // 비교 및 취소용
  const [isEditing, setIsEditing] = useState(false)

  // --- Edit Mode State ---
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editCharacters, setEditCharacters] = useState('') // Comma separated string
  const [editLocations, setEditLocations] = useState('') // Comma separated string
  const [editTags, setEditTags] = useState('') // Comma separated string

  // Focus Control
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && filePath) {
      loadDetail()
    } else {
      // 닫힐 때 상태 초기화
      setIsEditing(false)
      setOriginalData(null)
    }
  }, [isOpen, filePath])

  // [FIX] 포커스 잠금 해결 로직
  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        window.focus()
        titleInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isEditing])

  const loadDetail = async () => {
    setLoading(true)
    try {
      // @ts-ignore
      const result = await window.api.getSceneDetail(filePath)
      if (result) {
        setOriginalData(result)
        syncStateFromData(result)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const syncStateFromData = (data: any) => {
    const fm = data.frontmatter || {}
    setEditTitle(fm.title || '')
    setEditContent(data.content || '')
    setEditSummary(fm.summary || '')
    setEditCharacters(Array.isArray(fm.characters) ? fm.characters.join(', ') : '')
    setEditLocations(Array.isArray(fm.locations) ? fm.locations.join(', ') : '')
    setEditTags(Array.isArray(fm.tags) ? fm.tags.join(', ') : '')
  }

  const handleSave = async () => {
    try {
      // 배열 변환 유틸
      const toArray = (str: string) =>
        str
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s !== '')

      const payload = {
        path: filePath,
        content: editContent,
        data: {
          ...originalData.frontmatter, // 기존 데이터 유지 (scene number 등)
          title: editTitle,
          summary: editSummary,
          characters: toArray(editCharacters),
          locations: toArray(editLocations),
          tags: toArray(editTags),
          updatedAt: new Date().toISOString()
        }
      }

      // @ts-ignore
      const res = await window.api.updateScene(payload)
      if (res.success) {
        setIsEditing(false)
        loadDetail() // 최신 데이터로 다시 로드
        if (onUpdate) onUpdate()
        window.focus()
      } else {
        alert('저장 실패: ' + res.message)
        window.focus()
      }
    } catch (err) {
      console.error(err)
      alert('저장 중 오류 발생')
      window.focus()
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 씬을 정말 삭제하시겠습니까? (파일이 휴지통으로 이동합니다)')) {
      window.focus()
      return
    }

    try {
      // @ts-ignore
      const res = await window.api.deleteItem(filePath)
      if (res) {
        onClose()
        if (onUpdate) onUpdate()
        window.focus()
      } else {
        alert('삭제 실패')
        window.focus()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCancel = () => {
    if (originalData) syncStateFromData(originalData)
    setIsEditing(false)
  }

  const getFileName = (path: string) => path.split(/[\\/]/).pop()?.replace(/\.md$/i, '') || ''

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex overflow-hidden">
        {/* --- Left Column: Metadata Sidebar --- */}
        <div className="w-80 bg-slate-950 flex flex-col border-r border-slate-800 flex-shrink-0">
          {/* Header Info */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-600/20 p-1.5 rounded text-blue-400">
                <FileText size={16} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Scene Details
              </span>
            </div>
            <div className="text-[10px] text-slate-600 font-mono break-all leading-tight">
              {filePath}
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Summary */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                Summary (요약)
              </label>
              {isEditing ? (
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:border-blue-500 outline-none resize-none leading-relaxed"
                  placeholder="씬의 내용을 요약하세요..."
                />
              ) : (
                <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 leading-relaxed min-h-[100px]">
                  {editSummary || <span className="text-slate-600 italic">요약 없음</span>}
                </div>
              )}
            </div>

            {/* Characters */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                <User size={12} /> Characters
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editCharacters}
                  onChange={(e) => setEditCharacters(e.target.value)}
                  placeholder="콤마(,)로 구분 (예: 철수, 영희)"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editCharacters ? (
                    editCharacters.split(',').map((char, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs rounded-md"
                      >
                        {char.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600">- None -</span>
                  )}
                </div>
              )}
            </div>

            {/* Locations */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                <MapPin size={12} /> Locations
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editLocations}
                  onChange={(e) => setEditLocations(e.target.value)}
                  placeholder="콤마(,)로 구분"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editLocations ? (
                    editLocations.split(',').map((loc, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-xs rounded-md"
                      >
                        {loc.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600">- None -</span>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                <Tag size={12} /> Tags
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="태그 입력..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editTags ? (
                    editTags.split(',').map((tag, i) => (
                      <span key={i} className="text-xs text-slate-500">
                        #{tag.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600">- None -</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Right Column: Content Editor/Viewer --- */}
        <div className="flex-1 flex flex-col bg-[#0b0e14] relative">
          {/* Top Bar (Actions) */}
          {/* [FIX] sticky 제거, justify-between 적용, 배경색 불투명으로 변경 */}
          <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/90 backdrop-blur-sm relative z-20 shrink-0">
            {/* Title Area */}
            <div className="flex-1 min-w-0 mr-4">
              {isEditing ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent text-xl font-bold text-white border-b border-blue-500 focus:outline-none w-full px-1 pb-1"
                  placeholder="씬 제목"
                  autoComplete="off"
                />
              ) : (
                <h2
                  className="text-xl font-bold text-white truncate"
                  title={editTitle || getFileName(filePath)}
                >
                  {editTitle || getFileName(filePath)}
                </h2>
              )}
            </div>

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
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/20 border border-transparent transition-colors mr-2"
                  >
                    <Trash2 size={14} /> 삭제
                  </button>
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

          {/* Editor/Viewer Body */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">로딩 중...</div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[500px] bg-transparent text-slate-300 text-sm leading-relaxed focus:outline-none resize-none font-mono"
                  placeholder="씬의 내용을 작성하세요..."
                  spellCheck={false}
                />
              ) : (
                <article className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editContent || '*내용이 없습니다.*'}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
