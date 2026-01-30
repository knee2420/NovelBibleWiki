import React, { useEffect, useState } from 'react'
import { X, Calendar, User, MapPin, FileText, Tag } from 'lucide-react'
// React Markdown이 설치되어 있다고 가정합니다. 없다면 <pre> 태그로 대체 가능
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SceneDetailModalProps {
  filePath: string
  isOpen: boolean
  onClose: () => void
}

export const SceneDetailModal = ({ filePath, isOpen, onClose }: SceneDetailModalProps) => {
  const [data, setData] = useState<{ frontmatter: any; content: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && filePath) {
      loadDetail()
    }
  }, [isOpen, filePath])

  const loadDetail = async () => {
    setLoading(true)
    try {
      // @ts-ignore
      const result = await window.api.getSceneDetail(filePath)
      setData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  const getFileName = (path: string) => {
    const base = path.split(/[\\/]/).pop() || '' // 윈도우(\) 및 맥(/) 경로 모두 대응
    return base.replace(/\.md$/i, '') // 확장자 제거
  }
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* 1. Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none mb-1">
                {data?.frontmatter?.title || getFileName(filePath)}
              </h2>
              <p className="text-xs text-slate-500 font-mono">{filePath}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 2. Body Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            데이터를 불러오는 중...
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">

            {/* Left: Main Content (Editor/Viewer) */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/30">
              <article className="prose prose-invert prose-slate max-w-none">
                {/* 마크다운 렌더링 */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {data?.content || ''}
                </ReactMarkdown>
              </article>
            </div>

            {/* Right: Metadata Sidebar */}
            <div className="w-80 border-l border-slate-800 bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Scene Metadata</h3>

              {/* Summary Section */}
              <div className="mb-6">
                <label className="text-xs text-slate-500 mb-1 block">요약 (Summary)</label>
                <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 leading-relaxed">
                  {data?.frontmatter?.summary || '요약 없음'}
                </div>
              </div>

              {/* Characters Section */}
              <div className="mb-6">
                <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                  <User size={12} /> 등장인물
                </label>
                <div className="flex flex-wrap gap-2">
                  {data?.frontmatter?.characters?.map((char: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs rounded-md">
                      {String(char).replace(/\[\[|\]\]/g, '')}
                    </span>
                  )) || <span className="text-slate-600 text-xs">없음</span>}
                </div>
              </div>

              {/* Locations Section */}
              <div className="mb-6">
                <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                  <MapPin size={12} /> 장소
                </label>
                <div className="flex flex-wrap gap-2">
                  {data?.frontmatter?.locations?.map((loc: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-xs rounded-md">
                      {String(loc).replace(/\[\[|\]\]/g, '')}
                    </span>
                  )) || <span className="text-slate-600 text-xs">없음</span>}
                </div>
              </div>

               {/* Tags Section */}
               <div className="mb-6">
                <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                  <Tag size={12} /> 태그
                </label>
                <div className="flex flex-wrap gap-2">
                  {data?.frontmatter?.tags?.map((tag: string, idx: number) => (
                    <span key={idx} className="text-xs text-slate-400 hover:text-slate-200">
                      #{String(tag).replace('#', '')}
                    </span>
                  )) || <span className="text-slate-600 text-xs">없음</span>}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
