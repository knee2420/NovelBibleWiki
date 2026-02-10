import { useState, useRef, useEffect } from 'react'
import { WikiEntry } from '../../types/wiki'
import { CharacterFieldConfig, SceneFieldConfig } from '../../../../shared/types/field-config'
import {
  X,
  Edit2,
  Save,
  XCircle,
  Tag,
  FileText,
  Layout,
  Trash2,
  Image as ImageIcon,
  Plus,
  MinusCircle,
  Clock, 
  BookOpen,
  Activity,
  Maximize2,
  Minimize2,
  Search // [NEW]
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { CharacterHistoryViewer } from '../Analysis/CharacterHistoryViewer' 
import { CharacterStatusViewer } from '../Analysis/CharacterStatusViewer' 
import { WikiMentionViewer } from './WikiMentionViewer'
import { CharacterGrowthTree } from '../Analysis/CharacterGrowthTree' // [NEW] 
import { CharacterAnalysisEngine } from '../Analysis/CharacterAnalysisEngine' // [NEW] 

interface WikiDetailModalProps {
  entry: WikiEntry
  onClose: () => void
  onUpdate?: () => void 
  onOpenScene?: (sceneId: string) => void // [NEW] Navigation callback
}

export const WikiDetailModal = ({ entry, onClose, onUpdate, onOpenScene }: WikiDetailModalProps) => {
  // --- View Mode Data ---
  const [activeTab, setActiveTab] = useState<'overview' | 'status' | 'history' | 'mentions'>('overview')
  const [isMaximized, setIsMaximized] = useState(false) // [NEW] Window State
  const [fieldConfig, setFieldConfig] = useState<(CharacterFieldConfig | SceneFieldConfig)[]>([])

  // --- Edit Mode State ---
  const [isEditing, setIsEditing] = useState(false)

  const [editTitle, setEditTitle] = useState(entry.name)
  const [editType, setEditType] = useState(entry.type)
  const [editContent, setEditContent] = useState(entry.content || '')
  const [editTags, setEditTags] = useState(entry.tags?.join(', ') || '')
  const [editImage, setEditImage] = useState((entry.info as any)?.image || '')
  const [editInfo, setEditInfo] = useState({ ...entry.info })
  const [newMetaKey, setNewMetaKey] = useState('')
  const [newMetaValue, setNewMetaValue] = useState('')
  const [previewImage, setPreviewImage] = useState(entry.image || '')
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchConfig = async () => {
        try {
            // @ts-ignore
            const res = await window.api.getFieldConfig()
            if (entry.type === 'character') {
                setFieldConfig((res.character || []) as CharacterFieldConfig[])
            } else if (entry.type === 'scene') {
                setFieldConfig((res.scene || []) as SceneFieldConfig[])
            } else {
                setFieldConfig([]) // No config for item/location yet
            }
        } catch (e) {
            console.error(e)
        }
    }
    fetchConfig()
  }, [entry.type])

  // ... (Keep existing hooks and handlers unchanged)
  // Just copying handlers to ensure context exists, or I can use the same pattern as before if I don't need to change them.
  // Actually, I should use the range replacement to avoid rewriting everything. 
  
  // Handlers (truncated for brevity in ReplacementContent, I will target the full file structure with carefully chosen start/end lines if I rewrite the whole thing, OR use specific blocks)
  // Since I need to change imports AND render AND state, a full rewrite might be safer to avoid offset errors, or multiple chunks.
  // I will use multiple chunks.
  
  // CHUNK 1: Imports
  
  // CHUNK 2: State
  
  // CHUNK 3: Modal Container Class
  
  // CHUNK 4: Child Component Props
  
  // Wait, `replace_file_content` allows multiple chunks but requires exact string matching.
  // Let's do it in one go if I can match the surrounding code.
  // Actually, I'll just rewrite the Return statement and the imports/state.
  
  // Let's stick to the instruction: "Add Maximize toggle..."
  
  // I will just use `replace_file_content` with specific blocks.
  

  // Derived Data
  const aliases = (entry.info as any)?.alias ? [(entry.info as any).alias] : []




  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        ;(document.activeElement as HTMLElement)?.blur()
        titleInputRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer)
    }
    return () => {} // Explicitly return a cleanup function or nothing consistently
  }, [isEditing])

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
        content: editContent,
        info: { ...editInfo, image: editImage }
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

  const handleSelectImage = async () => {
    const result = await window.api.selectImage()
    if (result) {
      setEditImage(result.path) // 저장할 땐 경로(String) 사용
      setPreviewImage(result.preview) // 보여줄 땐 Base64 사용
      setEditInfo((prev) => ({ ...prev, image: result.path })) // Metadata 상태도 동기화
    }
  }

  const handleAddMeta = () => {
    if (!newMetaKey.trim()) {
      alert('키(Key)를 입력해주세요.')
      return
    }
    setEditInfo((prev) => ({
      ...prev,
      [newMetaKey.trim()]: newMetaValue
    }))
    setNewMetaKey('')
    setNewMetaValue('')
  }

  const handleRemoveMeta = (key: string) => {
    setEditInfo((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleCancel = () => {
    // 변경 사항 취소하고 원래 데이터로 리셋
    setEditTitle(entry.name)
    setEditType(entry.type)
    setEditContent(entry.content || '')
    setEditTags(entry.tags?.join(', ') || '')
    setEditImage((entry.info as any)?.image || '')
    setPreviewImage(entry.image || '')
    setEditInfo({ ...entry.info })
    setIsEditing(false)
  }

  const handleInfoChange = (key: string, value: string) => {
    setEditInfo((prev: any) => ({
      ...prev,
      [key]: value
    }))
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

    try {
      // @ts-ignore
      const res = await window.api.deleteWikiEntry(entry.id)
      if (res.success) {
        if (onUpdate) onUpdate() // 목록 갱신
        onClose() // 모달 닫기
      } else {
        alert('삭제 실패: ' + res.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (!entry) return null

  // Draft 판별 (UI 표시용)
  const isDraft = entry.id.includes('00_Draft')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      {/* Modal Container */}
      <div className={`relative bg-slate-900 border border-slate-700 shadow-2xl flex overflow-hidden transition-all duration-300 ${isMaximized ? 'fixed inset-0 w-screen h-screen z-[110] rounded-none border-0' : 'w-full max-w-5xl h-[85vh] rounded-2xl'}`}>
        {/* --- Left Column: Image & Meta (Fixed width) --- */}
        <div className="w-80 bg-slate-950 flex flex-col border-r border-slate-800 flex-shrink-0">
          {/* Image Area */}
          <div className="aspect-[3/4] w-full bg-black/50 relative overflow-hidden group">
            {/* [FIXED] 복잡한 로직 제거하고 previewImage state 사용 */}
            {previewImage ? (
              <img
                src={previewImage}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700">
                NO IMAGE
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-10">
                <div className="w-full space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block text-center mb-2">
                    Change Image
                  </label>

                  <button
                    onClick={handleSelectImage}
                    className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-600 rounded-xl p-4 hover:border-blue-500 hover:bg-slate-800/50 transition-all text-slate-400 hover:text-blue-400"
                  >
                    <ImageIcon size={24} />
                    <span className="text-xs">Click to Select File</span>
                  </button>

                  {/* 경로 직접 수정이 필요하다면 아래 input 유지, 아니면 생략 가능 */}
                  <div className="text-[10px] text-slate-500 truncate px-1 text-center">
                    {editImage || 'No file selected'}
                  </div>
                </div>
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
            {/* Dynamic Metadata Section */}
            {(fieldConfig.length > 0 || Object.keys(editInfo || {}).length > 0 || isEditing) && (
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-2">
                  Metadata
                </label>

                {/* 1. Configured Fields */}
                {fieldConfig.map(field => {
                    const val = editInfo[field.key]
                    if (field.isInternal) return null // Hide internal fields
                    if (!val && !isEditing) return null // Skip empty in view mode

                    return (
                        <div key={field.key} className="space-y-1">
                             <div className="flex justify-between items-center">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{field.label}</label>
                                {isEditing && (
                                    <button onClick={() => handleRemoveMeta(field.key)} className="text-slate-700 hover:text-red-400"><MinusCircle size={10} /></button> 
                                )}
                             </div>
                             
                             {isEditing ? (
                                 field.type === 'textarea' ? (
                                     <textarea 
                                         value={val || ''}
                                         onChange={(e) => handleInfoChange(field.key, e.target.value)}
                                         className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none h-20 resize-none"
                                     />
                                 ) : field.type === 'select' ? (
                                    <select
                                        value={val || ''}
                                        onChange={(e) => handleInfoChange(field.key, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                                    >
                                        <option value="">Select...</option>
                                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select> 
                                 ) : (
                                     <input 
                                         type={field.type === 'number' ? 'number' : 'text'}
                                         value={val || ''}
                                         onChange={(e) => handleInfoChange(field.key, e.target.value)}
                                         className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                                     />
                                 )
                             ) : (
                                 <div className="text-xs text-slate-300 bg-slate-900/50 px-2 py-1 rounded border border-slate-800/50 min-h-[24px]">
                                     {field.type === 'textarea' ? <span className="whitespace-pre-wrap">{val}</span> : val}
                                 </div>
                             )}
                        </div>
                    )
                })}

                {/* 2. Extra Fields (Legacy or Ad-hoc) */}
                {Object.entries(editInfo || {}).map(([key, value]) => {
                    // Check if already rendered via Config
                    if (fieldConfig.some(f => f.key === key)) return null
                    if (['title', 'type', 'tags', 'image', 'created', 'updated'].includes(key)) return null
                    
                    return (
                      <div key={key} className="space-y-1 relative group">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] text-slate-500 capitalize">{key}</span>
                           {isEditing && (
                            <button
                               onClick={() => handleRemoveMeta(key)}
                               className="text-slate-600 hover:text-red-400 transition-colors"
                             >
                               <MinusCircle size={10} />
                             </button>
                           )}
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={String(value)}
                            onChange={(e) => handleInfoChange(key, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-blue-500 outline-none"
                          />
                        ) : (
                          <div className="text-xs text-slate-300 bg-slate-900/50 px-2 py-1 rounded border border-slate-800/50 truncate">
                             {String(value)}
                          </div>
                        )}
                      </div>
                    )
                })}

                {/* Add New Field (Only for Ad-hoc, or prompt user to use Builder?) */}
                {isEditing && (
                     <div className="pt-2 border-t border-dashed border-slate-800 mt-4">
                        <div className="flex gap-1 items-center">
                          <input
                            type="text"
                            placeholder="New Key"
                            value={newMetaKey}
                            onChange={(e) => setNewMetaKey(e.target.value)}
                            className="w-1/3 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-300 focus:border-blue-500 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={newMetaValue}
                            onChange={(e) => setNewMetaValue(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-300 focus:border-blue-500 outline-none"
                          />
                          <button
                            onClick={handleAddMeta}
                            className="p-1 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                     </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* --- Right Column: Content Editor/Viewer --- */}
        <div className="flex-1 flex flex-col bg-[#0b0e14] min-w-0 relative z-0">
          {/* Header (Title & Actions) */}
          <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#0b0e14] relative shrink-0 z-20">
            <div className="w-full min-w-0 pr-36">
              {isEditing ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-white border-b border-blue-500 focus:outline-none w-full px-1 pb-1"
                  placeholder="문서 제목"
                />
              ) : (
                <h1 className="text-2xl font-bold text-slate-100 truncate" title={entry.name}>
                  {entry.name}
                </h1>
              )}
            </div>

            <div className="absolute right-6 top-0 h-full flex items-center gap-2">
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
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors mr-1"
                    title={isMaximized ? "Restore" : "Maximize"}
                  >
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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
          <div className="flex-1 w-full min-w-0 bg-[#0b0e14] relative flex flex-col overflow-hidden">
            
             {/* [NEW] Tabs for Entity */}
            {!isEditing && ['character', 'location', 'item', 'faction'].includes(entry.type) && (
                <div className="flex items-center border-b border-slate-800 bg-slate-950/50 sticky top-0 z-10 px-6 backdrop-blur-sm shrink-0">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <BookOpen size={14} /> 개요 (Overview)
                    </button>
                    {entry.type === 'character' && (
                        <>
                            <button
                                onClick={() => setActiveTab('status')}
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'status' ? 'border-green-500 text-green-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                <Activity size={14} /> 상태 (Status)
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                <Clock size={14} /> 타임라인 (History)
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setActiveTab('mentions')}
                        className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'mentions' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Search size={14} /> 멘션 (Mentions)
                    </button>
                    {/* Top-level Engine tab removed */}
                </div>
            )}

            {isEditing ? (
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-full min-h-[500px] bg-transparent text-slate-300 text-sm leading-relaxed focus:outline-none resize-none font-mono"
                        placeholder="# 내용을 입력하세요..."
                    />
                </div>
            ) : (
                <>
                    {/* Overview Sub-tabs Logic */}
                    {activeTab === 'overview' ? (
                        <OverviewSection entry={entry} aliases={aliases} onOpenScene={onOpenScene} />
                    ) : entry.type === 'character' && activeTab === 'history' ? (
                        <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CharacterHistoryViewer characterName={entry.name} aliases={aliases} />
                        </div>
                    ) : entry.type === 'character' && activeTab === 'status' ? (
                        <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CharacterStatusViewer entry={entry} />
                        </div>
                    ) : activeTab === 'mentions' ? (
                        <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                            <WikiMentionViewer characterName={entry.name} aliases={aliases} onOpenScene={onOpenScene} />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-200 prose-a:text-blue-400 w-full break-words">
                                <ReactMarkdown>{entry.content || ''}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </>
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

// Sub-component for Overview Sub-tabs
const OverviewSection = ({ entry, aliases = [], onOpenScene }: { 
  entry: WikiEntry
  aliases?: string[]
  onOpenScene?: (sceneId: string) => void
}) => {
    const [subTab, setSubTab] = useState<'profile' | 'growth' | 'mindset'>('profile')

    if (entry.type !== 'character') {
         return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-200 prose-a:text-blue-400 w-full break-words">
                    <ReactMarkdown>{entry.content || ''}</ReactMarkdown>
                </div>
            </div>
         )
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f1115]">
            {/* Overview Sub Tabs */}
            <div className="flex items-center px-6 pt-4 border-b border-slate-800 gap-6">
                 <button 
                    onClick={() => setSubTab('profile')}
                    className={`pb-3 text-sm font-bold transition-colors border-b-2 ${subTab === 'profile' ? 'border-slate-300 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                 >
                    프로필 (Profile)
                 </button>
                 <button 
                    onClick={() => setSubTab('growth')}
                    className={`pb-3 text-sm font-bold transition-colors border-b-2 ${subTab === 'growth' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                 >
                    캐릭터 성장 곡선 (Growth)
                 </button>
                 <button 
                    onClick={() => setSubTab('mindset')}
                    className={`pb-3 text-sm font-bold transition-colors border-b-2 ${subTab === 'mindset' ? 'border-pink-500 text-pink-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                 >
                    캐릭터 사고 방식 (Mindset)
                 </button>
            </div>

            {/* Content Content by Subtab */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                 {subTab === 'profile' ? (
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-8 h-full">
                        <div className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-200 prose-a:text-blue-400 w-full break-words">
                             <ReactMarkdown>{entry.content || ''}</ReactMarkdown>
                        </div>
                     </div>
                 ) : subTab === 'growth' ? (
                     <div className="w-full h-full">
                         <CharacterGrowthTree characterId={entry.id} characterName={entry.name} />
                     </div>
                 ) : subTab === 'mindset' ? (
                     <div className="w-full h-full">
                         <CharacterAnalysisEngine 
                             character={entry} 
                             aliases={aliases}
                             onOpenScene={onOpenScene}
                         />
                     </div>
                 ) : (
                     <div className="flex-1 flex items-center justify-center text-slate-600 italic">
                         Unknown subtab.
                     </div>
                 )}
            </div>
        </div>
    )
}
