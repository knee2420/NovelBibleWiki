import React, { useEffect, useState, useMemo } from 'react';
import { Search, Loader2, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';

interface MentionMatch {
    keyword: string;
    context: string;
    index: number;
}

interface MentionResult {
    sceneId: string;
    sceneTitle: string;
    chapterNumber: number;
    sceneNumber: number;
    chapterTitle: string;
    matches: MentionMatch[];
}

interface WikiMentionViewerProps {
    characterName: string;
    aliases?: string[];
}

export const WikiMentionViewer: React.FC<WikiMentionViewerProps> = ({ characterName, aliases = [] }) => {
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<MentionResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMentions = async () => {
            setLoading(true);
            try {
                const keywords = [characterName, ...aliases].filter(Boolean);
                // @ts-ignore
                const data = await window.api.searchWikiMentions(keywords);
                setResults(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMentions();
    }, [characterName, aliases]);

    // Group by Act/Chapter
    const grouped = useMemo(() => {
        const map = new Map<number, MentionResult[]>();
        results.forEach(r => {
            const ch = r.chapterNumber || 0;
            if (!map.has(ch)) map.set(ch, []);
            map.get(ch)!.push(r);
        });
        return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    }, [results]);

    // Stats
    const totalMentions = useMemo(() => results.reduce((acc, r) => acc + r.matches.length, 0), [results]);
    const totalScenes = results.length;

    // Scroll to selected scene
    const scrollToScene = (id: string) => {
        const element = document.getElementById(`mention-scene-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setSelectedSceneId(id);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-xs uppercase tracking-widest font-bold opacity-70">Scanning Manuscript...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
                <AlertCircle className="w-8 h-8" />
                <span>Error: {error}</span>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <Search className="w-8 h-8 opacity-20" />
                <span className="text-sm">No mentions found for "{characterName}"</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0b0e14]">
            {/* Header Stats */}
            <div className="h-12 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-950/50 backdrop-blur-sm shrink-0 z-10">
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <div>
                        <span className="text-slate-500 mr-1.5">APPEARANCES:</span>
                        <span className="text-blue-400 font-bold">{totalMentions}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 mr-1.5">SCENES:</span>
                        <span className="text-white font-bold">{totalScenes}</span>
                    </div>
                </div>
                <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
                    Scanning: {characterName} {aliases.length > 0 && `+ ${aliases.length} aliases`}
                </div>
            </div>

            {/* Timeline Heatmap (Mini) */}
            <div className="p-4 border-b border-slate-800 overflow-x-auto no-scrollbar bg-slate-900/20 shrink-0">
                <div className="flex gap-0.5 h-8 items-end">
                    {results.map((r, i) => {
                        const intensity = Math.min(r.matches.length, 10) / 10; // 0.1 to 1.0
                        return (
                            <div 
                                key={i}
                                onClick={() => scrollToScene(r.sceneId)}
                                className={`w-1.5 min-w-[4px] rounded-t-sm cursor-pointer transition-all hover:bg-white hover:scale-y-125
                                    ${intensity > 0.7 ? 'bg-blue-500' : intensity > 0.3 ? 'bg-blue-500/60' : 'bg-blue-500/30'}
                                    ${selectedSceneId === r.sceneId ? 'ring-1 ring-white z-10' : ''}
                                `}
                                style={{ height: `${20 + (intensity * 80)}%` }}
                                title={`${r.chapterTitle} - ${r.sceneTitle} (${r.matches.length})`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* High Density List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {grouped.map(([chapterNum, scenes]) => (
                    <div key={chapterNum} className="space-y-4">
                        <div className="flex items-center gap-2 sticky top-0 bg-[#0b0e14]/95 backdrop-blur py-2 z-10 border-b border-slate-800/50">
                            <BookOpen size={14} className="text-slate-500" />
                            <h3 className="text-sm font-bold text-slate-300">
                                {scenes[0].chapterTitle || `Chapter ${chapterNum}`}
                            </h3>
                        </div>

                        <div className="grid gap-4">
                            {scenes.map(scene => (
                                <div 
                                    key={scene.sceneId} 
                                    id={`mention-scene-${scene.sceneId}`}
                                    className={`
                                        group rounded border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/60 transition-colors
                                        ${selectedSceneId === scene.sceneId ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''}
                                    `}
                                >
                                    {/* Scene Layout: Header stick left, Mentions flow right/down? Or compact vertical list? User said "Compressed" */}
                                    <div className="flex flex-col md:flex-row gap-0 md:divide-x divide-slate-800/50">
                                        {/* Scene Meta (Side) */}
                                        <div className="w-full md:w-48 p-3 shrink-0 flex flex-col justify-between">
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Scene {scene.sceneNumber}</div>
                                                <div className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug" title={scene.sceneTitle}>
                                                    {scene.sceneTitle}
                                                </div>
                                            </div>
                                            
                                            {/* Action: Go to Scene (Not functional without parent handler yet, but UI placeholder) */}
                                            <div className="mt-4 pt-2 border-t border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300">
                                                    OPEN SCENE <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mentions (Main) */}
                                        <div className="flex-1 p-3 min-w-0 font-serif text-sm text-slate-400 space-y-1.5">
                                            {scene.matches.map((match, idx) => (
                                                <div key={idx} className="leading-relaxed hover:text-slate-300 transition-colors relative pl-3 border-l-2 border-transparent hover:border-blue-500/50">
                                                    {/* KWIC Display */}
                                                    <span 
                                                        dangerouslySetInnerHTML={{
                                                            __html: highlightKeyword(match.context, match.keyword)
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper: Highlight keyword in text safely in separate spans
function highlightKeyword(text: string, keyword: string) {
    // Basic replace (case insensitive)
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="text-blue-300 font-medium bg-blue-500/10 rounded px-0.5">$1</span>');
}
