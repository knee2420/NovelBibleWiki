import React from 'react'
import { ItemEntry } from '../../types/wiki'
import { X, Share2, Download, Sword } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ItemDetailProps {
  data: ItemEntry
  onClose: () => void
}

export const ItemDetail = ({ data, onClose }: ItemDetailProps) => {
  const info = data.info || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors">
          <X size={24} />
        </button>

        {/* Left Side */}
        <div className="w-full md:w-1/3 bg-gradient-to-b from-slate-800 to-slate-900 p-8 flex flex-col items-center border-r border-slate-700 overflow-y-auto">
          <div className="w-48 h-48 rounded-lg border-2 border-purple-500/50 overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.2)] mb-6 flex-shrink-0 bg-black/40 flex items-center justify-center">
            {data.image ? <img src={data.image} alt={data.name} className="w-full h-full object-cover" /> : <Sword size={48} className="text-purple-500/50"/>}
          </div>
          <h2 className="text-3xl font-bold text-white mb-1 text-center">{data.name}</h2>
          <span className="text-purple-400 font-medium tracking-widest text-sm mb-6 uppercase">{info.category || 'Unknown Type'}</span>

          <div className="flex gap-2 mb-6">
             <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-300 text-xs font-bold">
                {info.rarity || 'Common'}
             </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-2/3 p-8 bg-slate-900/95 overflow-y-auto">
          <div className="mb-8 border-b border-slate-700 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span> Item Spec
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-y-4 mb-8 text-sm">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">분류</span> <span className="text-slate-200">{info.category}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">등급</span> <span className="text-purple-300 font-bold">{info.rarity}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">소유자</span> <span className="text-slate-200">{info.owner || '-'}</span>
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <Markdown remarkPlugins={[remarkGfm]}>{data.content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  )
}
