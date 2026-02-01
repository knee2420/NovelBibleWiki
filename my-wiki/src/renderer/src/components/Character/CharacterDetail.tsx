import { CharacterEntry } from '../../types/wiki'
import { X, Share2, Download } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CharacterDetailProps {
  data: CharacterEntry
  onClose: () => void
}

export const CharacterDetail = ({ data, onClose }: CharacterDetailProps) => {
  // info가 없을 경우를 대비해 빈 객체로 초기화
  const info = data.info || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Main Container (Capsule) */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Left: Visual & Quick Stats */}
        <div className="w-full md:w-1/3 bg-gradient-to-b from-slate-800 to-slate-900 p-8 flex flex-col items-center border-r border-slate-700 overflow-y-auto">
          <div className="w-48 h-48 rounded-full border-4 border-cyan-500/30 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)] mb-6 flex-shrink-0">
            {data.image ? (
              <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                NO IMG
              </div>
            )}
          </div>

          <h2 className="text-3xl font-bold text-white mb-1 text-center">{data.name}</h2>
          <span className="text-cyan-400 font-medium tracking-widest text-sm mb-6 uppercase">
            {info.alias || info.role || 'Unknown'}
          </span>

          {/* Quick Actions */}
          <div className="flex gap-4 mb-8">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-600 transition-colors">
              <Share2 size={16} /> 공유
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-600 transition-colors">
              <Download size={16} /> 저장
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 justify-center">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-800 border border-slate-600 rounded-full text-xs text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Attributes & Context */}
        <div className="w-full md:w-2/3 p-8 bg-slate-900/95 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* Section Header */}
          <div className="mb-8 border-b border-slate-700 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
              Attributes (기본 정보)
            </h3>
          </div>

          {/* Attribute Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-10 text-sm">
            {/* data.attributes 대신 info 사용, undefined 방지를 위해 || '-' 추가 */}
            <AttributeRow label="소속" value={info.affiliation || '-'} />
            <AttributeRow label="이명" value={info.alias || '-'} />
            <AttributeRow label="역할" value={info.role || '-'} />
            <AttributeRow label="현재 상태" value={info.status || '-'} />

            <div className="col-span-full mt-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span className="block text-slate-400 text-xs mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                Database / Profile
              </span>

              {/* 마크다운 렌더러 */}
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    h1: ({ node, ...props }) => (
                      <h1 className="text-xl font-bold text-cyan-400 mt-6 mb-3" {...props} />
                    ),
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-lg font-bold text-white mt-6 mb-3 border-b border-slate-700 pb-2"
                        {...props}
                      />
                    ),
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    h3: ({ node, ...props }) => (
                      <h3 className="text-base font-bold text-slate-200 mt-4 mb-2" {...props} />
                    ),
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside space-y-1 my-3 pl-2" {...props} />
                    ),
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    strong: ({ node, ...props }) => (
                      <strong className="text-cyan-200 font-bold" {...props} />
                    ),
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-cyan-500/50 pl-4 py-1 italic text-slate-400 my-4 bg-slate-800/30 rounded-r"
                        {...props}
                      />
                    )
                  }}
                >
                  {data.content}
                </Markdown>
              </div>
            </div>
          </div>

          {/* Gallery / Media Section (Placeholder) */}
          <div className="mb-8 pt-8 border-t border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
              Gallery & Media
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-video bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center text-slate-500 hover:border-yellow-500/50 transition-colors cursor-pointer group">
                <span className="group-hover:text-yellow-500 transition-colors">Concept Art</span>
              </div>
              <div className="aspect-video bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center text-slate-500 hover:border-yellow-500/50 transition-colors cursor-pointer group">
                <span className="group-hover:text-yellow-500 transition-colors">
                  In-Novel Scene
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Component for Table Rows
const AttributeRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center border-b border-slate-800 py-3 hover:bg-slate-800/30 px-2 rounded transition-colors">
    <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">{label}</span>
    <span className="text-slate-200 font-semibold text-right truncate max-w-[60%]">{value}</span>
  </div>
)
