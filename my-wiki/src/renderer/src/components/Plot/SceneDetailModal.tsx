import { useEffect, useState, useRef } from 'react'
import {
  X,
  User,
  MapPin,
  FileText,
  Tag,
  Edit2,
  Save,
  XCircle,
  Trash2,
  Plus,
  MinusCircle,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { AIAnalyzePanel } from '../AI/AIAnalyzePanel'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { WikiEntry } from '../../types/wiki'
import { CharacterReviewModal } from '../AI/CharacterReviewModal'
import { useCharacterReview } from '../../hooks/useCharacterReview'
import { SceneFieldConfig } from '../../../../shared/types/field-config'
import { WikiDataRenderer } from '../Shared/WikiDataRenderer'

interface SceneDetailModalProps {
  filePath: string
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
  wikiData?: WikiEntry[]
}

export const SceneDetailModal = ({
  filePath,
  isOpen,
  onClose,
  onUpdate,
  wikiData = []
}: SceneDetailModalProps) => {
  const [loading, setLoading] = useState(false)
  
  // --- Data State ---
  const [originalData, setOriginalData] = useState<any>(null)
  const [fieldConfig, setFieldConfig] = useState<SceneFieldConfig[]>([])
  const [isEditing, setIsEditing] = useState(false)

  // --- Edit Mode State ---
  // Title and Content are special - Title maps to filename, Content to body
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  
  // Universal Metadata State (Includes Summary, Characters, etc.)
  const [editMetadata, setEditMetadata] = useState<Record<string, any>>({})

  // Ad-hoc field addition
  const [newMetaKey, setNewMetaKey] = useState('')
  const [newMetaValue, setNewMetaValue] = useState('')

  const [isGraphDataExpanded, setIsGraphDataExpanded] = useState(false)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)

  // [Hook] Use Character Review
  const { 
    isReviewing, 
    pendingReviews, 
    reviewIndex, 
    decisions, 
    detectNewCharacters, 
    handleReviewAction, 
    waitForReview,
    resetReview
  } = useCharacterReview(wikiData)

  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && filePath) {
      loadDetail()
    } else {
      setIsEditing(false)
      setOriginalData(null)
      setIsAIPanelOpen(false)
      resetReview()
      setEditMetadata({})
      setEditTitle('')
      setEditContent('')
    }
  }, [isOpen, filePath])

  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => {
        window.focus()
        titleInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isEditing])

  const loadDetail = async () => {
    setLoading(true)
    try {
      // @ts-ignore
      const [detailData, configData] = await Promise.all([
          (window as any).api.getSceneDetail(filePath),
          (window as any).api.getFieldConfig()
      ])
      
      const config = configData?.scene || []
      // Sort config by order
      config.sort((a, b) => (a.order || 99) - (b.order || 99))
      
      setFieldConfig(config)
      
      if (detailData) {
        setOriginalData(detailData)
        setEditTitle(detailData.frontmatter?.title || '')
        setEditContent(detailData.content || '')
        
        // Sync Metadata
        const reserved = ['title', 'updatedAt'] // fields handled internally or specially
        const meta = { ...detailData.frontmatter }
        reserved.forEach(k => delete meta[k])
        setEditMetadata(meta)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const activeDecisions = Object.keys(decisions).length > 0 ? Object.values(decisions) : undefined

      const payload = {
        path: filePath,
        content: editContent,
        data: {
          ...originalData.frontmatter,
          title: editTitle, // Explicitly set title
          ...editMetadata,  // Spread all dynamic fields
          updatedAt: new Date().toISOString()
        },
        decisions: activeDecisions
      }

      // @ts-ignore
      const res = await window.api.updateScene(payload)
      if (res.success) {
        setIsEditing(false)
        loadDetail()
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
     // Revert
     if (originalData) {
        setEditTitle(originalData.frontmatter?.title || '')
        setEditContent(originalData.content || '')
        const reserved = ['title', 'updatedAt']
        const meta = { ...originalData.frontmatter }
        reserved.forEach(k => delete meta[k])
        setEditMetadata(meta)
     }
     setIsEditing(false)
  }

  // --- Dynamic Metadata Handlers ---

  const handleMetaChange = (key: string, val: any) => {
    setEditMetadata((prev) => ({ ...prev, [key]: val }))
  }
  
  const handleArrayChange = (key: string, strVal: string) => {
      // Convert comma-separated string back to array on change (or on blur? keeping simple on change for now)
      // Actually, better to store as Array in state, but use string for input
      // Wait, if we use setEditMetadata, we should store what we want in JSON
      const arr = strVal.split(',').map(s => s.trim()).filter(s => s !== '')
      setEditMetadata((prev) => ({ ...prev, [key]: arr }))
  }

  const handleAddMeta = () => {
    if (!newMetaKey.trim()) {
      alert('키(Key)를 입력해주세요.')
      window.focus()
      return
    }
    setEditMetadata((prev) => ({ ...prev, [newMetaKey.trim()]: newMetaValue }))
    setNewMetaKey('')
    setNewMetaValue('')
  }
  
   const handleRemoveMeta = (key: string) => {
    setEditMetadata((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const getFileName = (path: string) => path.split(/[\\/]/).pop()?.replace(/\.md$/i, '') || ''

  const handleAIApply = async (data: any) => {
    const needsReview = detectNewCharacters(data)
    if (needsReview) await waitForReview()

    if (data.title) setEditTitle(data.title)
    
    // Apply all other fields dynamically
    setEditMetadata(prev => {
        const next = { ...prev }
        // Exclude internal
        const exclude = ['title'] 
        Object.keys(data).forEach(key => {
            if (!exclude.includes(key)) {
                next[key] = data[key]
            }
        })
        return next
    })
    
    setIsEditing(true)
    setIsAIPanelOpen(false)
  }
  
  // --- Render Helper ---
  const renderField = (field: SceneFieldConfig) => {
      const val = editMetadata[field.key]
      
      // Special Handling for Wiki Data (Graph)
      if (field.key === 'wiki-data') {
          return renderWikiData(val, field)
      }
      
      // Icons for known fields (Legacy support / Visuals)
      let Icon: any = null
      if (field.key === 'characters') Icon = User
      if (field.key === 'locations') Icon = MapPin
      if (field.key === 'tags') Icon = Tag
      if (field.key === 'summary') Icon = FileText

      return (
        <div key={field.key} className="space-y-2">
           <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
             {Icon && <Icon size={12} />} {field.label}
           </label>
           
           {field.type === 'textarea' ? (
                isEditing ? (
                    <textarea
                        value={val || ''}
                        onChange={(e) => handleMetaChange(field.key, e.target.value)}
                        className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:border-blue-500 outline-none resize-none leading-relaxed"
                        placeholder={`${field.label}...`}
                    />
                ) : (
                    <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                        {val || <span className="text-slate-600 italic">No {field.label}</span>}
                    </div>
                )
           ) : field.type === 'array' ? (
                isEditing ? (
                    <input
                        type="text"
                        // If generic array, join by comma.
                        defaultValue={Array.isArray(val) ? val.join(', ') : val || ''} 
                        // Using onBlur to commit array split to save re-renders? Or onChange?
                        // Let's use onChange but careful with cursor storage if we reconstruct array every time.
                        // Actually, easiest is to control a local string input, commit on blur. 
                        // But for simplicity in this turn, I'll just use onChange -> split
                        onChange={(e) => handleArrayChange(field.key, e.target.value)}
                        placeholder="Comma separated"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                    />
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(val) && val.length > 0 ? val.map((item: string, i: number) => (
                             <span key={i} className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-md">{String(item || '').trim()}</span>
                        )) : <span className="text-xs text-slate-600">- None -</span>}
                    </div>
                )
           ) : field.type === 'select' ? (
                 <select 
                    disabled={!isEditing}
                    value={val || ''}
                    onChange={(e) => handleMetaChange(field.key, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 outline-none disabled:opacity-50"
                 >
                    <option value="">Select...</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </select>
           ) : (
                // Default Text / Number
                isEditing ? (
                    <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={val || ''}
                        onChange={(e) => handleMetaChange(field.key, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                    />
                ) : (
                     <div className="text-sm text-slate-300 px-3 py-2 bg-slate-900/50 rounded border border-slate-800">
                        {val || <span className="text-slate-600 italic">-</span>}
                     </div>
                )
           )}
        </div>
      )
  }
  
  const renderWikiData = (wikiDataVal: any, field: SceneFieldConfig) => {
      // Logic from previous implementation, but scoped
      if (!wikiDataVal) return null;
      return (
          <div key={field.key} className="space-y-2 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setIsGraphDataExpanded(!isGraphDataExpanded)}
                  className="w-full flex items-center justify-between group"
                >
                    <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1">
                      <Sparkles size={12} /> {field.label} (Active)
                    </div>
                    {isGraphDataExpanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                </button>
                
                {isGraphDataExpanded && (
                    <div className="pl-2 animate-in slide-in-from-top-2 duration-200 mt-2">
                        <WikiDataRenderer data={wikiDataVal} />
                    </div>
                )}
          </div>
      )
  }

  // --- Main Render ---

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex overflow-hidden relative">
        {/* --- Left Column: Metadata Sidebar --- */}
        <div className="w-80 bg-slate-950 flex flex-col border-r border-slate-800 flex-shrink-0">
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

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Dynamic Fields Loop */}
            {fieldConfig
                .filter(f => f.key !== 'title' && f.type !== 'system') // Hide title (in header)
                .map(field => renderField(field))
            }

            {/* Ad-hoc Metadata (Undefined Fields) */}
             <div className="space-y-2 mt-8 pt-8 border-t border-slate-800/50">
                     <label className="text-[10px] uppercase tracking-wider text-slate-600 font-bold block mb-2">
                       Extra Metadata
                     </label>
                     {Object.entries(editMetadata)
                        .filter(([k]) => !fieldConfig.some(f => f.key === k)) // Show only undefined keys
                        .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-xs border-b border-slate-800/30 pb-1 min-h-[28px]">
                            <span className="text-slate-500 capitalize flex items-center gap-1 w-1/3 truncate" title={key}>
                                {key}
                                {isEditing && (
                                    <button onClick={() => handleRemoveMeta(key)} className="text-slate-600 hover:text-red-400 transition-colors">
                                        <MinusCircle size={10} />
                                    </button>
                                )}
                            </span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={String(value)}
                                    onChange={(e) => handleMetaChange(key, e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-200 focus:border-blue-500 outline-none flex-1 min-w-0"
                                />
                            ) : (
                                <span className="text-slate-300 font-medium truncate flex-1 text-right">{String(value)}</span>
                            )}
                        </div>
                    ))}
                    
                    {isEditing && (
                        <div className="mt-2 pt-2 border-t border-dashed border-slate-800 flex gap-1 items-center">
                            <input type="text" placeholder="Key" value={newMetaKey} onChange={(e) => setNewMetaKey(e.target.value)} className="w-1/3 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-300 focus:border-blue-500 outline-none" />
                            <input type="text" placeholder="Value" value={newMetaValue} onChange={(e) => setNewMetaValue(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-slate-300 focus:border-blue-500 outline-none" />
                            <button onClick={handleAddMeta} className="p-1 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors"><Plus size={12} /></button>
                        </div>
                    )}
                </div>
          </div>
        </div>

        {/* --- Right Column: Content Editor/Viewer --- */}
        <div className="flex-1 flex flex-col bg-[#0b0e14] relative z-0">
          <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#0b0e14] relative shrink-0 z-20">
            <div className="w-full min-w-0 pr-36">
              {isEditing ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent text-xl font-bold text-white border-b border-blue-500 focus:outline-none w-full pb-1"
                  placeholder="Scene Title"
                  autoComplete="off"
                />
              ) : (
                <h2 className="text-xl font-bold text-white truncate" title={editTitle || getFileName(filePath)}>
                  {editTitle || getFileName(filePath)}
                </h2>
              )}
            </div>

            <div className="absolute right-6 top-0 h-full flex items-center gap-2">
              {!isAIPanelOpen && (
                <button
                  onClick={() => setIsAIPanelOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-300 hover:text-white hover:bg-purple-900/30 border border-purple-500/30 transition-colors mr-4"
                >
                  <Sparkles size={14} /> Smart Analyze
                </button>
              )}

              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                    <XCircle size={14} /> Cancel
                  </button>
                  <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                    <Save size={14} /> Save
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/20 border border-transparent transition-colors mr-2">
                    <Trash2 size={14} /> Delete
                  </button>
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                    <X size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">Loading...</div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 w-full min-w-0">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[500px] bg-transparent text-slate-300 text-sm leading-relaxed focus:outline-none resize-none font-mono"
                  placeholder="Scene content..."
                  spellCheck={false}
                />
              ) : (
                <article className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-200 prose-pre:whitespace-pre-wrap prose-pre:break-words w-full break-words">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editContent || '*No content*'}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          )}
        </div>

        {isAIPanelOpen && (
          <AIAnalyzePanel
            initialText={editContent}
            onApply={handleAIApply}
            onClose={() => setIsAIPanelOpen(false)}
          />
        )}
        
        <CharacterReviewModal
           isOpen={isReviewing}
           pendingReviews={pendingReviews}
           reviewIndex={reviewIndex}
           wikiData={wikiData}
           onAction={handleReviewAction}
        />
      </div>
    </div>
  )
}
