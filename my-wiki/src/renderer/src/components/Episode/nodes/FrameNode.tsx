import { memo } from 'react';
import { NodeResizer, NodeProps, Node } from '@xyflow/react';
import { SquareDashed } from 'lucide-react';

export type FrameNode = Node<{ label: string; width?: number; height?: number }, 'frame'>;

export const FrameNodeComponent = memo(({ data, selected }: NodeProps<FrameNode>) => {
    return (
        <>
            <NodeResizer 
                color="#94a3b8" 
                isVisible={selected} 
                minWidth={300} 
                minHeight={300} 
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
            />
            
            <div className={`relative w-full h-full border-2 border-dashed rounded-xl transition-all duration-200
                ${selected ? 'border-slate-400 bg-slate-800/20' : 'border-slate-700/50 hover:border-slate-600 bg-transparent'}
            `}>
                {/* Visual Label Tag */}
                <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors
                    ${selected ? 'bg-slate-400 text-slate-900' : 'bg-slate-800 text-slate-500 border border-slate-700'}
                `}>
                    Frame
                </div>

                {/* Optional Icon in corner */}
                <div className="absolute right-2 bottom-2 opacity-50 text-slate-700">
                     <SquareDashed size={24} strokeWidth={1} />
                </div>
            </div>
        </>
    );
});
