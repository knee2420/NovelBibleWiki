import React, { useState } from 'react';
import { NovelSegment, ScriptAnalysisResult } from '../../../../shared/types/script-analysis';
import { Sparkles, Play, RefreshCw, X } from 'lucide-react';

const COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', badgeBg: 'bg-blue-200', badgeText: 'text-blue-900' },
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', badgeBg: 'bg-red-200', badgeText: 'text-red-900' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', badgeBg: 'bg-green-200', badgeText: 'text-green-900' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', badgeBg: 'bg-yellow-200', badgeText: 'text-yellow-900' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', badgeBg: 'bg-purple-200', badgeText: 'text-purple-900' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', badgeBg: 'bg-pink-200', badgeText: 'text-pink-900' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', badgeBg: 'bg-indigo-200', badgeText: 'text-indigo-900' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', badgeBg: 'bg-orange-200', badgeText: 'text-orange-900' },
];

const NARRATOR_THEME = {
    bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', badgeBg: 'bg-gray-200', badgeText: 'text-gray-700'
};

interface ScriptAnalysisPanelProps {
    initialText: string;
    initialData?: ScriptAnalysisResult | null;
    knownCharacters?: string[];
    onResult?: (result: ScriptAnalysisResult) => void;
    onClose?: () => void;
}

export const ScriptAnalysisPanel: React.FC<ScriptAnalysisPanelProps> = ({ initialText, initialData, knownCharacters, onResult, onClose }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(initialData ? 'success' : 'idle');
    const [result, setResult] = useState<ScriptAnalysisResult | null>(initialData || null);
    const [error, setError] = useState<string | null>(null);
    const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
    const [colorMap, setColorMap] = useState<Record<string, typeof COLORS[0]>>({});

    // Initialize colors if data exists
    React.useEffect(() => {
        if (initialData) {
            const map: Record<string, typeof COLORS[0]> = {};
            initialData.characters.forEach((char: string, index: number) => {
                map[char] = COLORS[index % COLORS.length];
            });
            setColorMap(map);
        }
    }, [initialData]);

    const handleAnalyze = async () => {
        if (!initialText) return;
        setStatus('loading');
        setError(null);
        try {
            // @ts-ignore
            const res = await window.api.analyzeScript(initialText, knownCharacters);
            if (res.success && res.data) {
                const newResult = res.data;
                setResult(newResult);
                
                // Assign colors
                const map: Record<string, typeof COLORS[0]> = {};
                newResult.characters.forEach((char: string, index: number) => {
                    map[char] = COLORS[index % COLORS.length];
                });
                setColorMap(map);
                
                setStatus('success');
                if (onResult) onResult(newResult);
            } else {
                throw new Error(res.message || 'Analysis failed');
            }
        } catch (e: any) {
            setError(e.message);
            setStatus('error');
        }
    };

    if (status === 'idle') {
        const uniqueChars = Array.from(new Set(knownCharacters || []));
        
        return (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

                <div className="text-center space-y-5 relative z-10 p-6">
                    <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-sm ring-4 ring-blue-50">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Script Analysis</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                            Analyze dialogue, action, and narration structure.
                            <br/>
                            Identify speakers automatically.
                        </p>
                    </div>

                    {/* Detected Characters Preview */}
                    {uniqueChars.length > 0 && (
                        <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                             <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Detected Characters</div>
                             <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
                                 {uniqueChars.map((char, i) => (
                                     <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded text-xs shadow-sm">
                                         {char}
                                     </span>
                                 ))}
                             </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={handleAnalyze}
                            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                            <Play className="w-4 h-4 fill-current" /> Start Analysis
                        </button>
                    </div>

                    {initialText.length < 50 && (
                        <p className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Text too short to analyze.</p>
                    )}
                </div>
            </div>
        );
    }

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500">Analyzing structure and identifying speakers...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex flex-col items-center gap-2">
                <p>Error: {error}</p>
                <button onClick={handleAnalyze} className="text-sm underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
            {/* Header / Toolbar */}
            <div className="p-3 border-b flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Characters</span>
                    {result?.characters.map(char => {
                        const theme = colorMap[char];
                        const isHovered = hoveredCharacter === char;
                        return (
                            <button
                                key={char}
                                onMouseEnter={() => setHoveredCharacter(char)}
                                onMouseLeave={() => setHoveredCharacter(null)}
                                className={`
                                    px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer whitespace-nowrap
                                    ${theme ? `${theme.bg} ${theme.text} border ${theme.border}` : 'bg-gray-100 text-gray-600'}
                                    ${isHovered ? 'ring-2 ring-offset-1 ring-blue-400 scale-105' : ''}
                                `}
                            >
                                {char}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleAnalyze} 
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                        title="Re-analyze"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 overflow-y-auto p-6 bg-white font-serif text-lg leading-relaxed">
                <div className="max-w-3xl mx-auto space-y-6">
                    {result?.segments.map((segment, idx) => (
                        <SegmentRenderer 
                            key={idx} 
                            segment={segment} 
                            colorMap={colorMap} 
                            hoveredCharacter={hoveredCharacter} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

interface SegmentRendererProps {
    segment: NovelSegment;
    colorMap: Record<string, typeof COLORS[0]>;
    hoveredCharacter: string | null;
}

const SegmentRenderer: React.FC<SegmentRendererProps> = ({ segment, colorMap, hoveredCharacter }) => {
    const isNarrator = segment.actor === 'Narrator' || segment.actor === 'Unknown';
    const theme = isNarrator ? NARRATOR_THEME : (colorMap[segment.actor] || NARRATOR_THEME);
    
    const isGlobalHover = hoveredCharacter === segment.actor;
    // Dimmed logic: if hovering someone, and this is NOT that someone (and not narrator? usually keep narrator undimmed or dim everything else)
    // Actually typically dimming everything else except the focused character is better.
    const isDimmed = hoveredCharacter && !isGlobalHover;

    // Decoration
    let decorationClass = '';
    if (!isNarrator) {
        if (segment.type === 'dialogue') {
            decorationClass = `border-b-2 ${theme.border}`;
        } else if (segment.type === 'action') {
            decorationClass = `border-b-2 border-dashed ${theme.border}`;
        }
    }

    const textClass = isNarrator ? 'text-gray-500' : 'text-gray-900';
    const highlightClass = isGlobalHover ? `rounded px-1 -mx-1 ${theme.bg} shadow-sm` : '';

    return (
        <div className={`relative transition-opacity duration-300 ${isDimmed ? 'opacity-30 blur-[0.5px]' : 'opacity-100'}`}>
            <span className={`
                group relative inline decoration-clone py-1
                ${decorationClass}
                ${highlightClass}
                ${!isNarrator ? 'cursor-help' : ''}
            `}>
                <span className={textClass}>
                    {segment.type === 'dialogue' && !isNarrator && '"'}
                    {segment.text}
                    {segment.type === 'dialogue' && !isNarrator && '"'}
                </span>

                {/* Tooltip */}
                {!isNarrator && (
                    <span className={`
                        absolute -top-8 left-0 z-20 
                        flex items-center gap-1.5 px-2 py-1 rounded shadow-lg
                        text-[10px] font-sans font-bold tracking-wide uppercase whitespace-nowrap
                        opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:-translate-y-1 pointer-events-none
                        ${theme.badgeBg} ${theme.badgeText} ring-1 ring-black/5
                    `}>
                        <span className="opacity-70 font-medium normal-case">
                            {segment.type === 'action' ? 'Action' : 'Dialogue'}
                        </span>
                        <span>•</span>
                        {segment.actor}
                        {/* Arrow */}
                        <span className={`absolute -bottom-1 left-2 w-2 h-2 rotate-45 ${theme.badgeBg}`}></span>
                    </span>
                )}
            </span>
        </div>
    );
};
