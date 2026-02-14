import { useState } from 'react';
import { NodeResizer, NodeProps, Node } from '@xyflow/react';
import { StickyNote } from 'lucide-react';

export type TextNode = Node<{ text: string; color?: string }, 'text'>;

export const TextNodeComponent = ({ data, selected }: NodeProps<TextNode>) => {
    const [text, setText] = useState(data.text || '');

    return (
        <div className={`group relative min-w-[200px] min-h-[100px] h-full flex flex-col rounded-xl border bg-[#1e293b]/50 backdrop-blur-sm transition-all duration-200
            ${selected ? 'border-amber-400 ring-1 ring-amber-400/50 shadow-lg shadow-amber-900/20' : 'border-transparent hover:border-slate-600'}
        `}>
            <NodeResizer 
                color="#fbbf24" 
                isVisible={selected} 
                minWidth={200} 
                minHeight={100} 
            />
            
            {/* Header (Drag Handle) */}
            <div className="drag-handle h-6 flex items-center px-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                <StickyNote size={12} className="text-amber-500 mr-2" />
                <div className="w-full h-1 bg-slate-700/30 rounded-full" />
            </div>

            {/* Content area */}
            <textarea
                className="flex-1 w-full h-full bg-transparent border-none resize-none outline-none p-4 text-slate-200 text-sm leading-relaxed placeholder:text-slate-600 nodrag"
                placeholder="Type something..."
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    data.text = e.target.value;
                }}
            />
        </div>
    );
};
