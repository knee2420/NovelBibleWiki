import React from 'react'
import { LocationEntry } from '../../types/wiki'
import { X, MapPin } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const LocationDetail = ({ data, onClose }: { data: LocationEntry; onClose: () => void }) => {
  const info = data.info || {}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"><X size={24} /></button>

        <div className="w-full md:w-1/3 bg-gradient-to-b from-slate-800 to-slate-900 p-8 flex flex-col items-center border-r border-slate-700 overflow-y-auto">
          <div className="w-full aspect-video rounded-lg border-2 border-emerald-500/30 overflow-hidden mb-6 bg-black/40 flex items-center justify-center relative">
             {data.image ? <img src={data.image} className="w-full h-full object-cover" /> : <MapPin size={48} className="text-emerald-500/50"/>}
             <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-emerald-400 text-xs rounded border border-emerald-500/30">
                위험도: {info.dangerLevel || 'N/A'}
             </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center">{data.name}</h2>
          <span className="text-emerald-400 text-sm mt-1">{info.region}</span>
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
