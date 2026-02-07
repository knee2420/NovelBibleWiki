import { Activity, UserPlus, ArrowRight, Heart, X } from 'lucide-react'

interface WikiDataRendererProps {
    data: any
    title?: string
    icon?: any
}

export const WikiDataRenderer = ({ data, title = 'Graph Data', icon: Icon = Activity }: WikiDataRendererProps) => {
    if (!data) return null;
    const hasData = (data.appear?.length > 0) || (data.update?.length > 0) || (data.relations?.length > 0) || (data.disappear?.length > 0)
    if (!hasData) return null

    return (
        <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-slate-400 font-bold border-b border-slate-800/50 pb-1 mb-2">
            <Icon size={12} /> {title}
            </div>

            {/* Appear */}
            {(data.appear?.length || 0) > 0 && (
            <div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1 flex items-center gap-1"><UserPlus size={10} /> Appearing Characters</span>
                <div className="flex flex-wrap gap-1">
                {data.appear?.map((c:string, i:number) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-[11px] border border-blue-500/20">{c}</span>
                ))}
                </div>
            </div>
            )}

            {/* Disappear */}
            {(data.disappear?.length || 0) > 0 && (
            <div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1 flex items-center gap-1"><X size={10} /> Disappearing/Dead</span>
                <div className="flex flex-wrap gap-1">
                {data.disappear?.map((c:string, i:number) => (
                    <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-300 rounded text-[11px] border border-red-500/20 line-through">{c}</span>
                ))}
                </div>
            </div>
            )}

            {/* Updates */}
            {(data.update?.length || 0) > 0 && (
                <div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Status Updates</span>
                <div className="space-y-2">
                    {data.update?.map((u:any, i:number) => (
                    <div key={i} className="bg-slate-900/50 p-2 rounded border border-slate-800 text-xs">
                        <div className="font-bold text-amber-400 mb-1">{u.name}</div>
                        <div className="grid grid-cols-1 gap-1 pl-2">
                            {u.changes && Object.entries(u.changes).map(([k, v]) => (
                                <div key={k} className="flex items-start gap-2">
                                    <span className="text-slate-500 text-[10px] w-16 uppercase tracking-tight shrink-0 pt-0.5">{k}</span>
                                    <span className="text-slate-300 break-words">{String(v)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Relations */}
            {(data.relations?.length || 0) > 0 && (
                <div>
                <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">Relations</span>
                    <div className="space-y-1">
                    {data.relations?.map((r:any, i:number) => {
                        const isFriendly = ['FRIENDLY', 'TRUST', 'LOVE'].includes(r.mood);
                        const isHostile = ['HOSTILE', 'FEAR'].includes(r.mood);
                        return (
                            <div key={i} className="flex flex-col gap-1 bg-slate-900/50 p-2 rounded border border-slate-800 text-xs">
                                <div className="flex items-center gap-2 text-slate-300 mb-1">
                                    <span className="font-bold text-indigo-300">{r.source}</span>
                                    <ArrowRight size={10} className="text-slate-600" />
                                    <span className="font-bold text-indigo-300">{r.name}</span>
                                </div>
                                <div className="flex items-center justify-between pl-2 border-l-2 border-slate-800">
                                    <span className="text-slate-400 italic">{r.display || r.description || '-'}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {r.mood && (
                                            <span className={`flex items-center gap-1 text-[10px] px-1.5 rounded ${isFriendly ? 'bg-green-500/10 text-green-400' : isHostile ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {isFriendly && <Heart size={8} className="fill-current" />}
                                                {isHostile && <X size={8} />}
                                                {r.mood}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    </div>
                </div>
            )}
        </div>
    )
}
