// src/renderer/src/components/Common/CreateNewModal.tsx

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Loader2, Lock } from 'lucide-react'

interface CreateNewModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialType?: string
  lockType?: boolean
}

export const CreateNewModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'character',
  lockType = false
}: CreateNewModalProps) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState(initialType) // 기본값
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setType(initialType)
      setTitle('')
    }
  }, [isOpen, initialType])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!title.trim()) return alert('제목을 입력해주세요.')

    setLoading(true)
    try {
      // @ts-ignore
      const result = await window.api.createWikiEntry({
        title: title,
        type: type,
        content: `# ${title}\n\n새로운 문서입니다.` // 기본 본문
      })

      if (result.success) {
        alert(`[${title}] 문서가 _Drafts 폴더에 생성되었습니다!`)
        onSuccess()
        onClose()
        setTitle('') // 입력창 초기화
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[400px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/50">
          <span className="font-semibold text-white flex items-center gap-2">
            <Plus size={18} className="text-blue-400" />새 문서 생성
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* 1. 분류 선택 */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">데이터 분류 (Type)</label>
            {lockType ? (
              // [Locked Mode] 수정 불가 (고정됨)
              <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-400 flex items-center gap-2 cursor-not-allowed">
                <Lock size={14} />
                <span className="uppercase font-bold text-blue-400">{type}</span>
                <span className="text-xs ml-auto text-slate-600">(고정됨)</span>
              </div>
            ) : (
              // [Free Mode] 선택 가능
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="character">인물 (Character)</option>
                <option value="item">아이템 (Item)</option>
                <option value="location">장소 (Location)</option>
                <option value="faction">세력 (Faction)</option>
                <option value="other">기타 (Other)</option>
              </select>
            )}
          </div>

          {/* 2. 제목 입력 */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">문서 제목 (Title)</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`새로운 ${type} 이름 입력...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <p className="text-[10px] text-slate-500">
              * 파일명은 제목을 기반으로 자동 생성되며, `_Drafts` 폴더에 저장됩니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-950/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : '생성하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
