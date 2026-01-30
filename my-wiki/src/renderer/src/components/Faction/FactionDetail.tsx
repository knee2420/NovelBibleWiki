import React from 'react'
import { FactionEntry } from '../../types/wiki'
import { X, Flag } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const FactionDetail = ({ data, onClose }: { data: FactionEntry; onClose: () => void }) => {
  const info = data.info || {}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"><X size={24} /></button>

        <div className="w-full md:w-1/3 bg-gradient-to-b from-slate-800 to-slate-900 p-8 flex flex-col items-center border-r border-slate-700 overflow-y-auto">
          <div className="w-40 h-40 rounded-full border-4 border-orange-500/20 overflow-hidden mb-6 bg-black/40 flex items-center justify-center">
             {data.image ? <img src={data.image} className="w-full h-full object-cover" /> : <Flag size={48} className="text-orange-500/50"/>}
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-2">{data.name}</h2>
          <div className="w-full bg-orange-900/20 border border-orange-500/20 p-3 rounded-lg text-center">
            <p className="text-xs text-orange-400 uppercase">Leader</p>
            <p className="text-slate-200 font-bold">{info.leader || 'Unknown'}</p>
          </div>
        </div>

        <div className="w-full md:w-2/3 p-8 bg-slate-900/95 overflow-y-auto">
           <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <Markdown remarkPlugins={[remarkGfm]}>{data.content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  )
}
