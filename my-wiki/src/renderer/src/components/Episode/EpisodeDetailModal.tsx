
import { useState, useEffect } from 'react'
import { X, Save, Trash2, ImageIcon, Hash, Maximize2, Minimize2, Edit2, XCircle, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { WikiEntry } from '../../types/wiki'

interface EpisodeDetailModalProps {
  entry: WikiEntry
  onClose: () => void
  onUpdate: () => void
  onTagClick?: (tag: string) => void
  allTags?: string[]
}

export const EpisodeDetailModal = ({ entry, onClose, onUpdate, onTagClick, allTags = [] }: EpisodeDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  
  // Data States
  const [title, setTitle] = useState(entry.name)
  const [content, setContent] = useState(entry.content || '')
  const [tags, setTags] = useState<string[]>(entry.tags || [])
  const [image, setImage] = useState(entry.image || '') // Display Image (Base64 or URL)
  const [imagePath, setImagePath] = useState((entry.info as any)?.image || '') // Saved Path
  const [isUsed, setIsUsed] = useState((entry.info as any)?.isUsed || false)
  const [comment, setComment] = useState((entry.info as any)?.comment || '') // Private Memo

  // Input States
  const [tagInput, setTagInput] = useState('')

  // Autocomplete State
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredTags, setFilteredTags] = useState<string[]>([])

  // Reset state when entry changes
  useEffect(() => {
    setTitle(entry.name)
    setContent(entry.content || '')
    setTags(entry.tags || [])
    setImage(entry.image || '')
    setImagePath((entry.info as any)?.image || '')
    setIsUsed((entry.info as any)?.isUsed || false)
    setComment((entry.info as any)?.comment || '')
    setIsEditing(false)
    setTagInput('')
    setShowSuggestions(false)
  }, [entry])

  const handleSave = async () => {
    try {
      // @ts-ignore
      const result = await window.api.saveWikiEntry({
        id: entry.id,
        title: title,
        type: 'episode',
        tags: tags,
        content: content,
        info: {
          ...entry.info,
          image: imagePath,
          isUsed: isUsed,
          comment: comment
        }
      })

      if (result.success) {
        setIsEditing(false)
        onUpdate()
      } else {
        alert('저장 실패: ' + result.message)
      }
    } catch (error) {
      console.error(error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까? 돌이킬 수 없습니다.')) return

    try {
      // @ts-ignore
      const res = await window.api.deleteWikiEntry(entry.id)
      if (res.success) {
        onUpdate()
        onClose()
      } else {
        alert('삭제 실패: ' + res.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectImage = async () => {
    if (!isEditing) return
    // @ts-ignore
    const result = await window.api.selectImage()
    if (result) {
      setImagePath(result.path)
      setImage(result.preview)
    }
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setTagInput(val)
      
      if (val.trim() && allTags) {
          const matches = allTags
              .filter(t => t.toLowerCase().includes(val.toLowerCase()) && !tags.includes(t))
              .slice(0, 10) // Limit to 10
          setFilteredTags(matches)
          setShowSuggestions(matches.length > 0)
      } else {
          setShowSuggestions(false)
      }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const val = tagInput.trim()
        if (val && !tags.includes(val)) {
            setTags([...tags, val])
            setTagInput('')
            setShowSuggestions(false)
        }
    } else if (e.key === 'Escape') {
        setShowSuggestions(false)
    }
  }
  
  const selectSuggestion = (tag: string) => {
      if (!tags.includes(tag)) {
          setTags([...tags, tag])
          setTagInput('')
          setShowSuggestions(false)
      }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSuggestions(false)}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#0b0c15] border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row relative transition-all duration-300
            ${isMaximized ? 'fixed inset-0 w-screen h-screen rounded-none z-[110]' : 'w-[85vw] h-[85vh] max-w-6xl rounded-2xl'}
        `}
      >
        
        {/* LEFT COLUMN: Visuals & Meta */}
        <div className="w-full md:w-[320px] lg:w-[360px] bg-[#11121c] border-r border-slate-800 flex flex-col flex-shrink-0">
          {/* ... (Image Area remains) */}
          <div className="aspect-[4/3] w-full bg-black relative group overflow-hidden shrink-0">
             {image ? (
                <img 
                  src={image} 
                  className={`w-full h-full object-cover transition-all duration-500 ${isUsed ? 'grayscale brightness-75' : ''}`} 
                />
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-900">
                   <ImageIcon size={48} className="mb-2 opacity-30" />
                   <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">No Image</span>
                </div>
             )}
             
             {/* Edit Image Overlay */}
             {isEditing && (
                <div 
                  onClick={handleSelectImage}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                   <ImageIcon size={32} className="text-white mb-2" />
                   <span className="text-white text-xs font-bold">이미지 변경</span>
                </div>
             )}

             {/* Used Status Badge (Visual) */}
             {isUsed && (
                <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm border border-white/10 uppercase tracking-widest z-10">
                   Used
                </div>
             )}
          </div>

          {/* Meta Info Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
             
             {/* Status Toggle */}
             <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                   <div className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${isUsed ? 'bg-slate-700 text-slate-300' : 'bg-blue-900/30 text-blue-400'}`}>
                       {isUsed ? 'USED' : 'AVAILABLE'}
                   </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{isUsed ? '작품에 사용됨' : '사용 가능'}</span>
                    <button 
                       onClick={() => isEditing && setIsUsed(!isUsed)}
                       disabled={!isEditing}
                       className={`w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${isUsed ? 'bg-slate-700' : 'bg-blue-600'} ${!isEditing ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                    >
                       <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${isUsed ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                </div>
             </div>

             {/* Tags (Chip UI) */}
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                   <Hash size={10} /> Tags & Keywords
                </label>
                
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                         <span 
                            key={i} 
                            onClick={() => !isEditing && onTagClick && onTagClick(tag)}
                            className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1
                                ${isEditing 
                                    ? 'bg-slate-800 border-slate-600 text-slate-200' 
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 cursor-pointer'}
                            `}
                        >
                            #{tag}
                            {isEditing && (
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }} className="hover:text-red-400 ml-1">
                                    <X size={12} />
                                </button>
                            )}
                         </span>
                    ))}
                    
                    {isEditing && (
                        <div className="relative">
                             <input 
                                type="text"
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleAddTag}
                                placeholder="+ Tag"
                                className="w-24 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none border-b border-transparent focus:border-blue-500 py-1"
                            />
                            {/* Autocomplete Dropdown */}
                            {showSuggestions && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                    {filteredTags.map(suggestion => (
                                        <div 
                                            key={suggestion}
                                            onClick={() => selectSuggestion(suggestion)}
                                            className="px-3 py-2 text-xs text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                        >
                                            #{suggestion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
             </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="flex-1 bg-[#0b0c15] flex flex-col min-w-0 relative">
           
           {/* Header */}
           <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#0b0e14] shrink-0 justify-between">
                {/* Title */}
                <div className="flex-1 mr-4">
                    {isEditing ? (
                         <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent text-xl font-bold text-white border-b border-blue-500 focus:outline-none pb-1"
                            placeholder="Episode Title"
                         />
                    ) : (
                        <h1 className="text-xl font-bold text-slate-100 truncate">{title}</h1>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                           <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                              <XCircle size={14} /> 취소
                           </button>
                           <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                              <Save size={14} /> 저장
                           </button>
                        </>
                    ) : (
                        <>
                           <button onClick={handleDelete} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                              <Trash2 size={16} />
                           </button>
                           <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors">
                              <Edit2 size={14} /> 수정
                           </button>
                        </>
                    )}
                    
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    
                    <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                         {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                         <X size={20} />
                    </button>
                </div>
           </div>

           {/* Content Body */}
           <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0c15]">
              <div className="max-w-3xl mx-auto p-8 space-y-8">
                  {/* Content Section */}
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          CONTENT / SUMMARY
                      </label>
                      {isEditing ? (
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full min-h-[400px] bg-slate-900/50 border border-slate-700/50 rounded-lg p-6 text-slate-300 text-base leading-relaxed focus:border-blue-500 focus:outline-none resize-y font-mono"
                            placeholder="에피소드 내용을 입력하세요..."
                        />
                      ) : (
                        <div className="min-h-[100px] prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-200">
                            <ReactMarkdown>{content || '*내용이 없습니다.*'}</ReactMarkdown>
                        </div>
                      )}
                  </div>

                  <hr className="border-slate-800/50" />

                  {/* Private Memo Section */}
                  <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                           <MessageSquare size={10} /> PRIVATE MEMO
                       </label>
                       {isEditing ? (
                           <textarea 
                               value={comment}
                               onChange={(e) => setComment(e.target.value)}
                               placeholder="이 에피소드에 대한 나만의 생각..."
                               className="w-full h-32 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-sm text-slate-300 focus:border-blue-500 focus:outline-none resize-none"
                           />
                       ) : (
                           <div className="w-full min-h-[60px] bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 text-sm text-slate-400 italic leading-relaxed whitespace-pre-wrap">
                               {comment || "No private comments."}
                           </div>
                       )}
                  </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  )
}
