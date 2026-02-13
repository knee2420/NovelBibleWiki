import { useState, useRef, useEffect } from 'react'
import { X, Plus, Loader2, ImageIcon } from 'lucide-react'

interface EpisodeCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const EpisodeCreateModal = ({ isOpen, onClose, onSuccess }: EpisodeCreateModalProps) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [imagePath, setImagePath] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
        return // Returns undefined
    }

    setTitle('')
    setContent('')
    setTags('')
    setImagePath('')
    setImagePreview('')
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer) // Returns function
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectImage = async () => {
    // @ts-ignore
    const result = await window.api.selectImage()
    if (result) {
      setImagePath(result.path)
      setImagePreview(result.preview)
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) return alert('제목을 입력해주세요.')

    setLoading(true)
    try {
      // 태그 문자열 -> 배열 변환
      const tagsArray = tags.split(',').map((t) => t.trim()).filter((t) => t !== '')

      // @ts-ignore
      const result = await window.api.createWikiEntry({
        title: title,
        type: 'episode',
        content: content || `# ${title}\n\n내용을 입력하세요.`,
        image: imagePath,
        tags: tagsArray
      })

      if (result.success) {
        alert(`[${title}] 에피소드가 생성되었습니다!`)
        onSuccess()
        onClose()
      } else {
        alert('생성 실패: ' + result.message)
      }
    } catch (error) {
      console.error(error)
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[800px] h-[600px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <span className="font-bold text-lg text-white flex items-center gap-2">
            <Plus size={20} className="text-blue-400" />새 에피소드 추가
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Image Upload */}
          <div className="w-1/3 p-6 border-r border-slate-800 bg-slate-950 flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-400">대표 이미지</label>
            <div 
              onClick={handleSelectImage}
              className={`aspect-[3/4] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group
                ${imagePreview ? 'border-slate-700' : 'border-slate-600 hover:border-blue-500 hover:bg-slate-900'}
              `}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-bold">이미지 변경</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <ImageIcon size={32} />
                  <span className="text-xs">이미지 선택</span>
                </div>
              )}
            </div>
            {imagePath && (
                <div className="text-[10px] text-slate-600 truncate px-1">
                    {imagePath}
                </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-400">제 목</label>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="에피소드 제목을 입력하세요"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 text-lg focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-400">태 그</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="#태그1, #태그2 (콤마로 구분)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            {/* Content */}
            <div className="space-y-1 flex-1 flex flex-col">
              <label className="text-sm font-bold text-slate-400">내 용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="에피소드 내용을 입력하세요..."
                className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-blue-500 focus:outline-none placeholder:text-slate-600 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : '에피소드 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
