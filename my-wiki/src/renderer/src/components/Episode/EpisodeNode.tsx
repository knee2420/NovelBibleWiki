import { Handle, Position, Node, NodeProps } from '@xyflow/react'
import { CheckCircle2, Circle } from 'lucide-react'
import { WikiEntry } from '../../types/wiki'

// Define the Node type
export type EpisodeNode = Node<{ entry: WikiEntry }, 'episode'>

export const EpisodeNodeComponent = ({ data, selected }: NodeProps<EpisodeNode>) => {
    const { entry } = data
    const isUsed = (entry.info as any)?.isUsed || false
    const imageUrl = entry.image || (entry.info as any)?.image

    return (
        <div 
            className={`w-[280px] bg-[#11121c] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group
                ${selected ? 'ring-2 ring-blue-500 shadow-blue-900/40' : 'border border-slate-700'}
                ${isUsed ? 'border-slate-800 opacity-80 grayscale' : 'hover:border-blue-500/50'}
            `}
        >
            {/* Input Handle (Target) */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#0b0c15]" 
            />

            {/* Image Section */}
            <div className="h-32 bg-black relative overflow-hidden">
                {imageUrl ? (
                    <img src={imageUrl} className="w-full h-full object-cover" alt={entry.name} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                        No Image
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#11121c] via-transparent to-transparent opacity-80" />
                
                {/* Status Badge */}
                <div 
                    className={`absolute top-2 right-2 p-1 rounded-full backdrop-blur-md border z-10
                        ${isUsed ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-900/50 text-slate-400 border-slate-700'}
                    `}
                >
                    {isUsed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 relative">
                <h3 className={`font-bold text-sm truncate mb-1 
                    ${isUsed ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-100'}
                `}>
                    {entry.name}
                </h3>
                
                <p className="text-slate-400 text-xs line-clamp-2 h-8 leading-relaxed mb-3">
                    {entry.content?.replace(/[#*`]/g, '').slice(0, 100) || '내용 없음'}
                </p>

                {/* Tags Footer */}
                <div className="flex gap-1 overflow-hidden pt-3 border-t border-slate-800/50">
                    {entry.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-800/50 text-slate-500 text-[10px] rounded border border-slate-700/50">
                            #{tag}
                        </span>
                    ))}
                    {(entry.tags?.length || 0) > 2 && (
                        <span className="text-[10px] text-slate-600">+{entry.tags!.length - 2}</span>
                    )}
                </div>
            </div>

            {/* Output Handle (Source) */}
            <Handle 
                type="source" 
                position={Position.Right} 
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-[#0b0c15]" 
            />
        </div>
    )
}
