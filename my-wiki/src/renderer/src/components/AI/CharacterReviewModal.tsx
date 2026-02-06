import { AlertCircle, UserPlus, Merge, SkipForward } from 'lucide-react'
import { WikiEntry } from '../../types/wiki'

export interface PendingReview {
  name: string
  role: string
  info: any
}

export interface CharacterDecision {
  name: string
  action: 'create' | 'merge' | 'skip'
  targetId?: string // if merge
  targetName?: string // if merge
  grade?: 'MAIN' | 'SUB' | 'MINOR' | 'EXTRA' // [NEW] User selected grade
}

interface CharacterReviewModalProps {
  isOpen: boolean
  pendingReviews: PendingReview[]
  reviewIndex: number
  wikiData?: WikiEntry[]
  onAction: (action: 'create' | 'merge' | 'skip', targetId?: string, targetName?: string, grade?: 'MAIN' | 'SUB' | 'MINOR' | 'EXTRA') => void
}

import { useState, useEffect } from 'react'

export const CharacterReviewModal = ({
  isOpen,
  pendingReviews,
  reviewIndex,
  wikiData = [],
  onAction
}: CharacterReviewModalProps) => {
  const [selectedGrade, setSelectedGrade] = useState<'MAIN' | 'SUB' | 'MINOR' | 'EXTRA'>('EXTRA')

  // Reset grade on new review
  useEffect(() => {
    setSelectedGrade('EXTRA')
  }, [reviewIndex])

  if (!isOpen || pendingReviews.length === 0) return null

  const currentReview = pendingReviews[reviewIndex]

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-purple-500/50 rounded-2xl w-full max-w-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">신규 캐릭터 감지</h3>
            <p className="text-slate-400 text-sm">
              AI가 새로운 캐릭터를 발견했습니다. ({reviewIndex + 1}/{pendingReviews.length})
            </p>
          </div>
        </div>

        <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
              New Character
            </span>
            <span className="text-xs text-slate-500">Role: {currentReview.role}</span>
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-3 drop-shadow-sm">
            {currentReview.name || '(이름 불명)'}
          </h2>
          <p className="text-slate-400 text-sm line-clamp-3">
            {currentReview.info.desc || '상세 설명 없음'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Create New Block */}
          <div className="relative group flex flex-col gap-2">
            <button
              onClick={() => onAction('create', undefined, undefined, selectedGrade)}
              className="flex-1 w-full flex flex-col items-center justify-center gap-2 p-4 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all hover:scale-[1.02]"
            >
              <UserPlus className="w-6 h-6 text-white" />
              <span className="font-bold text-white">신규 생성</span>
              <span className="text-xs text-purple-200 opacity-60">
                 Grade: {selectedGrade}
              </span>
            </button>
            
            {/* Grade Selector (Small dropdown below button) */}
            <select
               value={selectedGrade}
               onChange={(e) => setSelectedGrade(e.target.value as any)}
               className="w-full bg-slate-800 text-slate-200 text-xs py-1 px-2 rounded border border-slate-700 focus:outline-none focus:border-purple-500"
            >
               <option value="MAIN">MAIN (주연)</option>
               <option value="SUB">SUB (조연)</option>
               <option value="MINOR">MINOR (단역)</option>
               <option value="EXTRA">EXTRA (엑스트라)</option>
            </select>
          </div>

          <div className="relative group">
            <button className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all hover:scale-[1.02]">
              <Merge className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-slate-200">기존 캐릭터 병합</span>
              <span className="text-xs text-slate-500 group-hover:text-slate-300">
                별칭으로 추가
              </span>
            </button>
            {/* Dropdown for Merge */}
            <div className="absolute top-full left-0 w-[200%] bg-slate-800 border border-slate-700 rounded-lg shadow-xl mt-2 p-2 hidden group-hover:block z-50 max-h-60 overflow-y-auto">
              <div className="text-xs text-slate-500 px-2 py-1 mb-1">병합할 캐릭터 선택:</div>
              {wikiData
                ?.filter((e) => e.type === 'character')
                .map((char) => (
                  <div
                    key={char.id}
                    onClick={() => onAction('merge', char.id, char.name)}
                    className="px-3 py-2 hover:bg-slate-700 rounded cursor-pointer text-sm text-slate-200 truncate"
                  >
                    {char.name}
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={() => onAction('skip')}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all hover:scale-[1.02] group"
          >
            <SkipForward className="w-6 h-6 text-slate-500 group-hover:text-slate-300" />
            <span className="font-bold text-slate-400 group-hover:text-slate-200">무시하기</span>
            <span className="text-xs text-slate-600 group-hover:text-slate-400">
              저장하지 않음
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
