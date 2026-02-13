import { useState, useEffect } from 'react'
import { X, Save, Trash2, ImageIcon, Lock, Unlock, Hash } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { WikiEntry } from '../../types/wiki'

interface EpisodeDetailModalProps {
  entry: WikiEntry
  onClose: () => void
  onUpdate: () => void
  onTagClick?: (tag: string) => void // [NEW] Optional handler
}

export const EpisodeDetailModal = ({ entry, onClose, onUpdate, onTagClick }: EpisodeDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(entry.name)
  const [content, setContent] = useState(entry.content || '')
  const [tags, setTags] = useState(entry.tags?.join(', ') || '')
  const [image, setImage] = useState(entry.image || '')
  const [imagePath, setImagePath] = useState((entry.info as any)?.image || '')
  const [isUsed, setIsUsed] = useState((entry.info as any)?.isUsed || false)

  // Reset state when entry changes
  useEffect(() => {
    setTitle(entry.name)
    setContent(entry.content || '')
    setTags(entry.tags?.join(', ') || '')
    setImage(entry.image || '')
    setImagePath((entry.info as any)?.image || '')
    setIsUsed((entry.info as any)?.isUsed || false)
    setIsEditing(false)
  }, [entry])

  const handleSave = async () => {
    try {
      const tagsArray = tags.split(',').map((t) => t.trim()).filter((t) => t !== '')

      // @ts-ignore
      const result = await window.api.saveWikiEntry({
        id: entry.id,
        title: title,
        type: 'episode',
        tags: tagsArray,
        content: content,
        info: {
          ...entry.info,
          image: imagePath,
          isUsed: isUsed
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-[85vw] h-[85vh] max-w-6xl bg-[#0b0c15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Close Button (Absolute) */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
           {!isEditing ? (
              <>
                 <button 
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 size={14} /> 삭제
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
                >
                   수정
                </button>
              </>
           ) : (
             <button 
                onClick={handleSave}
                className="px-4 py-1.5 rounded-full bg-green-500 hover:bg-green-400 text-white transition-colors text-xs font-bold flex items-center gap-1 shadow-lg shadow-green-900/20"
              >
                <Save size={14} /> 저장 완료
             </button>
           )}
           <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
           >
              <X size={20} />
           </button>
        </div>

        {/* LEFT COLUMN: Visuals & Meta */}
        <div className="w-full md:w-[400px] bg-[#11121c] border-r border-slate-800 flex flex-col flex-shrink-0">
          {/* Image Area */}
          <div className="aspect-square w-full bg-black relative group overflow-hidden">
             {image ? (
                <img 
                  src={image} 
                  className={`w-full h-full object-cover transition-all duration-500 ${isUsed ? 'grayscale brightness-50' : ''}`} 
                />
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-900/50">
                   <ImageIcon size={48} className="mb-2 opacity-50" />
                   <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
                </div>
             )}
             
             {/* Edit Image Overlay */}
             {isEditing && (
                <div 
                  onClick={handleSelectImage}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                   <ImageIcon size={32} className="text-white mb-2" />
                   <span className="text-white text-xs font-bold">이미지 변경</span>
                </div>
             )}

             {/* Used Status Badge (Visual) */}
             {isUsed && (
                <div className="absolute top-4 left-4 bg-slate-900/90 text-slate-400 text-xs font-black px-3 py-1 rounded backdrop-blur-sm border border-slate-700 uppercase tracking-widest">
                   Used
                </div>
             )}
          </div>

          {/* Meta Info */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
             {/* Title */}
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Title</label>
                {isEditing ? (
                   <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-bold focus:border-blue-500 outline-none"
                   />
                ) : (
                   <h1 className="text-2xl font-bold text-white leading-tight">{title}</h1>
                )}
             </div>

             {/* Status Toggle */}
             <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                   {isUsed ? <Lock className="text-slate-500" size={20} /> : <Unlock className="text-blue-400" size={20} />}
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-200">작품 사용 여부</span>
                      <span className="text-[10px] text-slate-500">{isUsed ? '이미 사용된 소재입니다.' : '사용 가능한 소재입니다.'}</span>
                   </div>
                </div>
                {/* Toggle Switch */}
                <button 
                   onClick={() => isEditing && setIsUsed(!isUsed)}
                   disabled={!isEditing}
                   className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${isUsed ? 'bg-slate-700' : 'bg-blue-600'} ${!isEditing ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isUsed ? 'translate-x-[24px]' : 'translate-x-0'}`} />
                </button>
             </div>

             {/* Tags */}
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                   <Hash size={10} /> Tags & Keywords
                </label>
                {isEditing ? (
                   <input 
                      type="text" 
                      value={tags} 
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="콤마로 구분"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-blue-500 outline-none"
                   />
                ) : (
                   <div className="flex flex-wrap gap-2">
                      {tags.split(',').filter(t => t.trim()).map((tag, i) => (
                         <span 
                            key={i} 
                            onClick={() => onTagClick && onTagClick(tag.trim())} // [NEW] Tag Click
                            className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                        >
                            #{tag.trim()}
                         </span>
                      ))}
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="flex-1 bg-[#0b0c15] flex flex-col min-w-0 relative">
           <div className="h-full flex flex-col">
              {isEditing ? (
                 <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full bg-transparent p-8 text-slate-300 text-base leading-relaxed focus:outline-none resize-none font-mono"
                    placeholder="에피소드 내용을 입력하세요..."
                 />
              ) : (
                 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-200">
                       <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  )
}
