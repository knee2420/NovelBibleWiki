import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Sparkles, ArrowRight, Bot, BookOpen, Search, PenTool, CheckCircle, XCircle, ChevronDown, ChevronUp, Users, User, MapPin, Target, X, Plus, Crosshair, Swords, Heart, Shield, FileText, Scroll, LayoutTemplate } from 'lucide-react'
import { WikiEntry } from '../../types/wiki'
import { ActBoard } from '../../types/plot'
import { StorySandbox } from './StorySandbox'

interface AIWriterPanelProps {
    currentContent: string
    sceneContext: { chapter: number, scene: number }
    wikiData: WikiEntry[]
    onApplyContent: (content: string) => void
    onClose: () => void
}

export type Message = {
    role: 'user' | 'assistant'
    content?: string
    toolCall?: {
        name: string
        args: any
        status?: 'pending' | 'success' | 'emulated'
        result?: any
    }
}

// Scene Setup Types
interface SceneSetup {
    mainCharacters: WikiEntry[]
    backgroundCharacters: WikiEntry[]
    locations: WikiEntry[]
    focusElements: WikiEntry[]
}

// --- Wiki Selector Component ---
const WikiSelector = ({ 
    label, 
    icon: Icon, 
    items, 
    selected, 
    onToggle,
    color = 'blue',
    placeholder = '선택...'
}: { 
    label: string, 
    icon: any, 
    items: WikiEntry[], 
    selected: WikiEntry[], 
    onToggle: (item: WikiEntry) => void,
    color?: string,
    placeholder?: string
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    
    const filtered = useMemo(() => {
        if (!search.trim()) return items
        const q = search.toLowerCase()
        return items.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))
    }, [items, search])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const colorMap: Record<string, { border: string, bg: string, text: string, badge: string }> = {
        blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-900/50 text-blue-300 border-blue-500/30' },
        amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-900/50 text-amber-300 border-amber-500/30' },
        emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/30' },
        purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-900/50 text-purple-300 border-purple-500/30' },
    }
    const c = colorMap[color] || colorMap.blue

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={11} className={c.text} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>{label}</span>
                <span className="text-[9px] text-slate-600">({selected.length})</span>
            </div>
            
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1 mb-1.5 min-h-[24px]">
                {selected.map(item => (
                    <span key={item.id} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md border ${c.badge} transition-all`}>
                        {item.name}
                        <button onClick={() => onToggle(item)} className="hover:text-white transition-colors">
                            <X size={9} />
                        </button>
                    </span>
                ))}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-md border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all`}
                >
                    <Plus size={9} /> 추가
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
                    <div className="p-1.5">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-slate-500"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-36 overflow-y-auto custom-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-2 text-[10px] text-slate-500 italic">결과 없음</div>
                        ) : (
                            filtered.map(item => {
                                const isSelected = selected.some(s => s.id === item.id)
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => { onToggle(item); }}
                                        className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center justify-between hover:bg-slate-800 transition-colors ${isSelected ? 'bg-slate-800/80' : ''}`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-slate-${isSelected ? '200' : '400'} truncate`}>{item.name}</span>
                                            {item.type !== 'character' && (
                                                <span className="text-[8px] px-1 py-0 bg-slate-800 rounded text-slate-600 border border-slate-700 uppercase shrink-0">{item.type}</span>
                                            )}
                                        </div>
                                        {isSelected && <CheckCircle size={11} className="text-emerald-400 shrink-0" />}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}


// --- GenUI Components ---

const ReadingCard = ({ args, name, status, result }: { args: any, name: string, status?: string, result?: any }) => {
    return (
    <div className={`bg-slate-800/50 border ${status === 'success' ? 'border-emerald-500/30' : 'border-blue-500/20'} rounded-lg p-3 my-2 w-[90%] ${status !== 'success' && 'animate-pulse'} flex flex-col gap-2`}>
        <div className="flex items-center gap-3">
            <div className={`p-1.5 ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'} rounded-full`}>
                {status === 'success' ? <CheckCircle size={14} /> : (name === 'read_previous_scenes' ? <BookOpen size={14} /> : <Search size={14} />)}
            </div>
            <div className="flex-1">
                <p className={`text-xs ${status === 'success' ? 'text-emerald-200' : 'text-blue-200'} font-bold`}>
                     {status === 'success' ? "분석 완료" : (name === 'read_previous_scenes' ? "문맥 파악 중..." : "위키 데이터 검색 중...")}
                </p>
                <p className="text-[10px] text-slate-400">
                    {status === 'success' && result ? (
                        <span className="text-slate-300 block mt-1">
                             {name === 'read_previous_scenes' ? `읽은 파일: ${result}` : result}
                        </span>
                    ) : (
                        name === 'read_previous_scenes' 
                            ? `이전 ${args.count}개 씬의 내용을 분석하고 있습니다.` 
                            : `관련 항목: ${args.names?.join(', ') || ''}`
                    )}
                </p>
            </div>
        </div>
    </div>
    )
}

const PlotOptionCard = ({ title, description, tone, onClick }: { title: string, description: string, tone: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 p-4 rounded-xl transition-all group"
    >
        <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-bold text-slate-200 group-hover:text-purple-300 transition-colors">{title}</h4>
            <span className="text-[10px] px-2 py-0.5 bg-slate-900 rounded-full text-slate-500 border border-slate-700 uppercase">{tone}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
            {description}
        </p>
    </button>
)

const PlotOptionsContainer = ({ args, onSelect }: { args: any, onSelect: (option: any) => void }) => (
    <div className="space-y-3 w-full my-2 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-2 mb-1 px-1">
             <Sparkles size={12} className="text-purple-500" />
             <span className="text-xs font-bold text-slate-500 uppercase">Suggested Plot Paths</span>
        </div>
        {args.options.map((opt: any, idx: number) => (
            <PlotOptionCard 
                key={idx}
                title={opt.title}
                description={opt.description}
                tone={opt.tone}
                onClick={() => onSelect(opt)}
            />
        ))}
    </div>
)

const DraftProposalCard = ({ args, onAccept, onReject }: { args: any, onAccept: () => void, onReject: () => void }) => (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl overflow-hidden my-2 w-full animate-in zoom-in-95 duration-300">
         <div className="bg-emerald-900/20 px-4 py-2 border-b border-emerald-500/20 flex items-center justify-between">
             <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                 <PenTool size={12} /> Generated Draft
             </span>
             <div className="flex gap-2">
                 <span className="text-[10px] text-emerald-200/50 uppercase">Tone: {args.tone}</span>
             </div>
         </div>
         <div className="p-4 max-h-60 overflow-y-auto custom-scrollbar bg-black/20">
             <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-serif">
                {args?.outline?.substring(0, 300)}... <span className="text-slate-500 italic">(Preview)</span>
             </p>
         </div>
         <div className="bg-slate-900/50 p-3 flex gap-2 justify-end border-t border-slate-800">
             <button onClick={onReject} className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors flex items-center gap-1">
                 <XCircle size={12} /> Discard
             </button>
             <button onClick={onAccept} className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-900/20 flex items-center gap-1">
                 <CheckCircle size={12} /> Apply to Editor
             </button>
         </div>
    </div>
)

// --- NEW GenUI: Character Proposal Card ---
const CharacterProposalCard = ({ args, wikiData, onConfirm, confirmed }: { args: any, wikiData: WikiEntry[], onConfirm: (main: string[], background: string[]) => void, confirmed?: boolean }) => {
    const [selectedMain, setSelectedMain] = useState<Set<string>>(new Set((args.main_candidates || []).map((c: any) => c.name)))
    const [selectedBg, setSelectedBg] = useState<Set<string>>(new Set((args.background_candidates || []).map((c: any) => c.name)))

    const toggleMain = (name: string) => {
        setSelectedMain(prev => {
            const next = new Set(prev)
            next.has(name) ? next.delete(name) : next.add(name)
            return next
        })
    }
    const toggleBg = (name: string) => {
        setSelectedBg(prev => {
            const next = new Set(prev)
            next.has(name) ? next.delete(name) : next.add(name)
            return next
        })
    }

    const findWiki = (name: string) => wikiData.find(w => w.name === name && w.type === 'character')

    return (
        <div className={`bg-slate-900 border ${confirmed ? 'border-blue-500/20' : 'border-blue-500/40'} rounded-xl overflow-hidden my-2 w-full animate-in slide-in-from-bottom-4 duration-300`}>
            <div className="bg-blue-900/20 px-4 py-2.5 border-b border-blue-500/20 flex items-center gap-2">
                <Users size={13} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-300">등장인물 제안</span>
                {confirmed && <span className="ml-auto text-[9px] text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded-full">✓ 확정됨</span>}
            </div>
            {args.message && (
                <div className="px-4 py-2 text-[11px] text-slate-400 border-b border-slate-800/50 leading-relaxed">{args.message}</div>
            )}
            
            {/* Main Characters */}
            <div className="px-4 pt-3 pb-1">
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">주요 등장</span>
            </div>
            <div className="px-3 pb-2 space-y-1">
                {(args.main_candidates || []).map((c: any, i: number) => {
                    const wiki = findWiki(c.name)
                    const isSelected = selectedMain.has(c.name)
                    return (
                        <button
                            key={i}
                            onClick={() => !confirmed && toggleMain(c.name)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] flex items-center gap-2 transition-all ${
                                isSelected 
                                    ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200' 
                                    : 'bg-slate-800/50 border border-transparent text-slate-400 hover:bg-slate-800'
                            } ${confirmed ? 'pointer-events-none' : 'cursor-pointer'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-500' : 'border-slate-600'}`}>
                                {isSelected && <CheckCircle size={10} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold truncate">{c.name}</span>
                                    {wiki && <span className="text-[8px] px-1 py-0 bg-blue-900/50 rounded text-blue-400 border border-blue-500/20 shrink-0">WIKI</span>}
                                    {wiki && (wiki as any).info?.role && <span className="text-[8px] text-slate-500">{(wiki as any).info.role}</span>}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.reason}</p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Background Characters */}
            {(args.background_candidates || []).length > 0 && (
                <>
                    <div className="px-4 pt-1 pb-1">
                        <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider">배경/언급</span>
                    </div>
                    <div className="px-3 pb-2 space-y-1">
                        {(args.background_candidates || []).map((c: any, i: number) => {
                            const wiki = findWiki(c.name)
                            const isSelected = selectedBg.has(c.name)
                            return (
                                <button
                                    key={i}
                                    onClick={() => !confirmed && toggleBg(c.name)}
                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-all ${
                                        isSelected 
                                            ? 'bg-amber-600/10 border border-amber-500/30 text-amber-200' 
                                            : 'bg-slate-800/30 border border-transparent text-slate-500 hover:bg-slate-800/50'
                                    } ${confirmed ? 'pointer-events-none' : 'cursor-pointer'}`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-600 border-amber-500' : 'border-slate-700'}`}>
                                        {isSelected && <CheckCircle size={9} className="text-white" />}
                                    </div>
                                    <span className="font-medium truncate">{c.name}</span>
                                    {wiki && <span className="text-[8px] px-1 bg-amber-900/30 rounded text-amber-500/70 border border-amber-600/20 shrink-0">WIKI</span>}
                                    <span className="text-[10px] text-slate-600 truncate ml-auto">{c.reason}</span>
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Confirm Button */}
            {!confirmed && (
                <div className="px-3 pb-3 pt-1">
                    <button
                        onClick={() => onConfirm(Array.from(selectedMain), Array.from(selectedBg))}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-1.5"
                    >
                        <CheckCircle size={12} /> 등장인물 확정
                    </button>
                </div>
            )}
        </div>
    )
}

// --- NEW GenUI: Location Proposal Card ---
const LocationProposalCard = ({ args, wikiData, onConfirm, confirmed }: { args: any, wikiData: WikiEntry[], onConfirm: (locations: string[]) => void, confirmed?: boolean }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set([(args.candidates || [])[0]?.name].filter(Boolean)))
    
    const toggle = (name: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(name) ? next.delete(name) : next.add(name)
            return next
        })
    }

    const findWiki = (name: string) => wikiData.find(w => w.name === name && w.type === 'location')

    return (
        <div className={`bg-slate-900 border ${confirmed ? 'border-emerald-500/20' : 'border-emerald-500/40'} rounded-xl overflow-hidden my-2 w-full animate-in slide-in-from-bottom-4 duration-300`}>
            <div className="bg-emerald-900/20 px-4 py-2.5 border-b border-emerald-500/20 flex items-center gap-2">
                <MapPin size={13} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">장소 제안</span>
                {confirmed && <span className="ml-auto text-[9px] text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ 확정됨</span>}
            </div>
            {args.message && (
                <div className="px-4 py-2 text-[11px] text-slate-400 border-b border-slate-800/50 leading-relaxed">{args.message}</div>
            )}
            <div className="p-3 space-y-1.5">
                {(args.candidates || []).map((loc: any, i: number) => {
                    const wiki = findWiki(loc.name)
                    const isSelected = selected.has(loc.name)
                    return (
                        <button
                            key={i}
                            onClick={() => !confirmed && toggle(loc.name)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-[11px] flex items-start gap-2.5 transition-all ${
                                isSelected
                                    ? 'bg-emerald-600/15 border border-emerald-500/40 text-emerald-200'
                                    : 'bg-slate-800/40 border border-transparent text-slate-400 hover:bg-slate-800'
                            } ${confirmed ? 'pointer-events-none' : 'cursor-pointer'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-emerald-600 border-emerald-500' : 'border-slate-600'}`}>
                                {isSelected && <CheckCircle size={10} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={10} className={isSelected ? 'text-emerald-400' : 'text-slate-600'} />
                                    <span className="font-bold">{loc.name}</span>
                                    {wiki && <span className="text-[8px] px-1 bg-emerald-900/40 rounded text-emerald-400 border border-emerald-500/20 shrink-0">WIKI</span>}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{loc.reason}</p>
                                {wiki?.description && <p className="text-[9px] text-slate-600 mt-1 italic truncate">{wiki.description}</p>}
                            </div>
                        </button>
                    )
                })}
            </div>
            {!confirmed && (
                <div className="px-3 pb-3">
                    <button
                        onClick={() => onConfirm(Array.from(selected))}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5"
                    >
                        <CheckCircle size={12} /> 장소 확정
                    </button>
                </div>
            )}
        </div>
    )
}

// --- NEW GenUI: Focus Proposal Card ---
const FocusProposalCard = ({ args, onConfirm, confirmed }: { args: any, onConfirm: (focuses: any[]) => void, confirmed?: boolean }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set((args.candidates || []).map((c: any) => c.name)))

    const toggle = (name: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(name) ? next.delete(name) : next.add(name)
            return next
        })
    }

    const typeIcons: Record<string, any> = {
        'character': User,
        'item': Sparkles,
        'faction': Shield,
        'theme': BookOpen,
        'conflict': Swords,
        'emotion': Heart
    }
    const typeColors: Record<string, string> = {
        'character': 'text-blue-400 bg-blue-900/30 border-blue-500/20',
        'item': 'text-yellow-400 bg-yellow-900/30 border-yellow-500/20',
        'faction': 'text-orange-400 bg-orange-900/30 border-orange-500/20',
        'theme': 'text-indigo-400 bg-indigo-900/30 border-indigo-500/20',
        'conflict': 'text-red-400 bg-red-900/30 border-red-500/20',
        'emotion': 'text-pink-400 bg-pink-900/30 border-pink-500/20'
    }

    return (
        <div className={`bg-slate-900 border ${confirmed ? 'border-purple-500/20' : 'border-purple-500/40'} rounded-xl overflow-hidden my-2 w-full animate-in slide-in-from-bottom-4 duration-300`}>
            <div className="bg-purple-900/20 px-4 py-2.5 border-b border-purple-500/20 flex items-center gap-2">
                <Crosshair size={13} className="text-purple-400" />
                <span className="text-xs font-bold text-purple-300">포커스 요소 제안</span>
                {confirmed && <span className="ml-auto text-[9px] text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded-full">✓ 확정됨</span>}
            </div>
            {args.message && (
                <div className="px-4 py-2 text-[11px] text-slate-400 border-b border-slate-800/50 leading-relaxed">{args.message}</div>
            )}
            <div className="p-3 space-y-1.5">
                {(args.candidates || []).map((focus: any, i: number) => {
                    const isSelected = selected.has(focus.name)
                    const FocusIcon = typeIcons[focus.type] || Target
                    const colorClass = typeColors[focus.type] || 'text-slate-400 bg-slate-800 border-slate-700'

                    return (
                        <button
                            key={i}
                            onClick={() => !confirmed && toggle(focus.name)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-[11px] flex items-start gap-2.5 transition-all ${
                                isSelected
                                    ? 'bg-purple-600/15 border border-purple-500/40 text-purple-200'
                                    : 'bg-slate-800/40 border border-transparent text-slate-400 hover:bg-slate-800'
                            } ${confirmed ? 'pointer-events-none' : 'cursor-pointer'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-purple-600 border-purple-500' : 'border-slate-600'}`}>
                                {isSelected && <CheckCircle size={10} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold">{focus.name}</span>
                                    <span className={`text-[8px] px-1.5 py-0 rounded border flex items-center gap-0.5 ${colorClass} shrink-0`}>
                                        <FocusIcon size={8} /> {focus.type}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{focus.description}</p>
                            </div>
                        </button>
                    )
                })}
            </div>
            {!confirmed && (
                <div className="px-3 pb-3">
                    <button
                        onClick={() => {
                            const selectedItems = (args.candidates || []).filter((c: any) => selected.has(c.name))
                            onConfirm(selectedItems)
                        }}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-purple-900/20 flex items-center justify-center gap-1.5"
                    >
                        <CheckCircle size={12} /> 포커스 확정
                    </button>
                </div>
            )}
        </div>
    )
}

// --- Scene Setup Summary Badge ---
const SetupSummaryBadge = ({ setup }: { setup: SceneSetup }) => {
    const total = setup.mainCharacters.length + setup.backgroundCharacters.length + setup.locations.length + setup.focusElements.length
    if (total === 0) return null
    return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-900/30 rounded-full border border-purple-500/20">
            <Target size={9} className="text-purple-400" />
            <span className="text-[9px] text-purple-300 font-medium">{total}개 설정됨</span>
        </div>
    )
}

// ==========================================================================
// Main Component
// ==========================================================================
export const AIWriterPanel = ({ currentContent, sceneContext, wikiData, onApplyContent, onClose }: AIWriterPanelProps) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSetupOpen, setIsSetupOpen] = useState(true) // Scene Setup expanded by default
    const [mode, setMode] = useState<'chat' | 'sandbox'>('chat') // New Mode State
    const [plotData, setPlotData] = useState<ActBoard[]>([]) // [NEW] Plot Data

    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Fetch Plot Data for Sandbox
    const fetchPlotData = useCallback(() => {
        // @ts-ignore
        window.api.getPlotData().then((data: ActBoard[]) => {
            setPlotData(data)
        }).catch(console.error)
    }, [])

    useEffect(() => {
        if (mode === 'sandbox') {
            fetchPlotData()
        }
    }, [mode, fetchPlotData])

    // --- Mention Logic State ---
    const [mentionState, setMentionState] = useState<{ active: boolean, query: string, index: number }>({ active: false, query: '', index: 0 })

    // Filtered items for mention
    const mentionItems = useMemo(() => {
        if (!mentionState.active) return []
        const query = mentionState.query.toLowerCase()
        return wikiData
            .filter(w => w.name.toLowerCase().includes(query) || (w.id || '').toLowerCase().includes(query))
            .slice(0, 10) // Limit results
    }, [mentionState.active, mentionState.query, wikiData])

    const getIconForType = (type: string) => {
        switch(type) {
            case 'character': return <User size={14} className="shrink-0" />
            case 'location': return <MapPin size={14} className="shrink-0" />
            case 'item': return <Shield size={14} className="shrink-0" />
            case 'faction': return <Users size={14} className="shrink-0" />
            case 'scene': return <FileText size={14} className="shrink-0" />
            default: return <Scroll size={14} className="shrink-0" />
        }
    }

    const confirmMention = (item: WikiEntry) => {
        if (!inputRef.current) return
        const cursor = inputRef.current.selectionStart || 0
        const textBefore = input.slice(0, cursor)
        const match = textBefore.match(/@([^\s]*)$/)
        
        if (match) {
            const prefix = input.slice(0, cursor - match[0].length)
            const suffix = input.slice(cursor)
            const insertion = `[[${item.name}]]`
            const newValue = prefix + insertion + ' ' + suffix
            setInput(newValue)
            setMentionState({ active: false, query: '', index: 0 })
            
            // Allow React render cycle to update value, then set focus?
            // Usually inputRef focus remains.
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setInput(val)
        
        const cursor = e.target.selectionStart || 0
        const textBefore = val.slice(0, cursor)
        // Check for @ followed by non-space chars at end of string
        const match = textBefore.match(/@([^\s]*)$/) 
        
        if (match) {
             setMentionState({ active: true, query: match[1], index: 0 })
        } else {
             setMentionState(prev => prev.active ? { ...prev, active: false } : prev)
        }
    }
    
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (mentionState.active && mentionItems.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionState(prev => ({ ...prev, index: Math.max(0, prev.index - 1) }))
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionState(prev => ({ ...prev, index: Math.min(mentionItems.length - 1, prev.index + 1) }))
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                confirmMention(mentionItems[mentionState.index])
            } else if (e.key === 'Escape') {
                e.preventDefault()
                setMentionState(prev => ({ ...prev, active: false }))
            }
        } else {
            if (e.key === 'Enter') {
               handleSend()
            }
        }
    }

    // --- Mention Chips Logic ---
    const mentionedFiles = useMemo(() => {
        const matches = input.match(/\[\[(.*?)\]\]/g) || []
        const uniqueNames = Array.from(new Set(matches.map(m => m.slice(2, -2))))
        return uniqueNames.map(name => {
            const entry = wikiData.find(w => w.name === name)
            return entry || { name, type: 'other' as const, id: 'Not found in wiki', description: '', tags: [], content: '', info: {} } as WikiEntry
        })
    }, [input, wikiData])

    const removeMention = (name: string) => {
        // Escaping special regex characters in name if necessary? For simplicity assuming standard names.
        // A safer replace would be split/join or non-regex if we expect conflicts.
        const token = `[[${name}]]`
        setInput(prev => prev.replace(token, ''))
    }

    // --- Scene Setup State ---
    const [sceneSetup, setSceneSetup] = useState<SceneSetup>({
        mainCharacters: [],
        backgroundCharacters: [],
        locations: [],
        focusElements: [],
    })

    // GenUI Session (Accumulated Context)
    const genUISession = useRef({
        mainCharacters: [] as string[],
        backgroundCharacters: [] as string[],
        locations: [] as string[],
        focusElements: [] as string[]
    })


    // Filtered Wiki Data by type
    const characters = useMemo(() => wikiData.filter(w => w.type === 'character'), [wikiData])
    const locations = useMemo(() => wikiData.filter(w => w.type === 'location'), [wikiData])
    const allItems = useMemo(() => wikiData.filter(w => w.type !== 'scene'), [wikiData]) // Everything except scene (for Focus)

    // Toggle helpers
    const toggleItem = (category: keyof SceneSetup) => (item: WikiEntry) => {
        setSceneSetup(prev => {
            const existing = prev[category]
            const isSelected = existing.some(e => e.id === item.id)
            return {
                ...prev,
                [category]: isSelected 
                    ? existing.filter(e => e.id !== item.id) 
                    : [...existing, item]
            }
        })
    }

    // Build Context String from Setup
    const buildSetupContext = (): string => {
        const parts: string[] = []
        
        if (sceneSetup.mainCharacters.length > 0) {
            parts.push(`\n[등장인물 (Main Characters)]`)
            sceneSetup.mainCharacters.forEach(c => {
                const info = (c as any).info || {}
                parts.push(`- ${c.name} (${info.role || '역할 미정'}, ${info.affiliation || '소속 미정'})`)
                if (c.description) parts.push(`  설명: ${c.description}`)
                if (info.alias) parts.push(`  이명: ${info.alias}`)
            })
        }
        
        if (sceneSetup.backgroundCharacters.length > 0) {
            parts.push(`\n[배경인물 (Background Characters) — 언급되거나 간접적으로 등장]`)
            sceneSetup.backgroundCharacters.forEach(c => {
                const info = (c as any).info || {}
                parts.push(`- ${c.name} (${info.role || ''})`)
            })
        }

        if (sceneSetup.locations.length > 0) {
            parts.push(`\n[장소 (Locations)]`)
            sceneSetup.locations.forEach(loc => {
                const info = (loc as any).info || {}
                parts.push(`- ${loc.name}${info.region ? ` (${info.region})` : ''}`)
                if (loc.description) parts.push(`  설명: ${loc.description}`)
            })
        }
        
        if (sceneSetup.focusElements.length > 0) {
            parts.push(`\n[이 씬의 포커스 요소 (Focus Elements) — 이 요소들을 중심으로 전개해야 함]`)
            sceneSetup.focusElements.forEach(el => {
                parts.push(`- [${el.type.toUpperCase()}] ${el.name}: ${el.description || ''}`)
            })
        }

        return parts.join('\n')
    }

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "안녕하세요! 글쓰기 파트너 AI입니다.\n\n위쪽의 '씬 설정'에서 등장인물, 장소, 포커스 요소 등을 설정하면\n더 정확한 이야기를 만들 수 있습니다.\n\n이번 씬에서는 어떤 이야기가 진행되나요?"
            }])
        }
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, loading])

    const handleCopyHistory = () => {
        const text = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content || JSON.stringify(m.toolCall)}`).join('\n\n')
        navigator.clipboard.writeText(text)
        alert("Conversation history copied!")
    }

    const handleSend = async (text?: string, hidden: boolean = false) => {
        const contentToSend = text !== undefined ? text : input
        
        if (!contentToSend.trim() || loading) return
        if (text === undefined) setInput('')

        let newHistory = [...messages]
        const userMsg: Message = { role: 'user', content: contentToSend }
        
        if (!hidden) {
             setMessages(prev => [...prev, userMsg])
        }
        newHistory.push(userMsg)
        setLoading(true)

        // Auto-collapse setup on first send
        if (isSetupOpen && messages.length <= 1) {
            setIsSetupOpen(false)
        }

        try {
            // Inject scene setup context into the message
            const setupContext = buildSetupContext()
            
            // Extract and inject referenced wiki entries (WikiLinks)
            const wikiLinkMatches = contentToSend.match(/\[\[(.*?)\]\]/g) || []
            const uniqueNames = Array.from(new Set(wikiLinkMatches.map(m => m.slice(2, -2))))
            const referencedEntries = uniqueNames
                .map(name => {
                    // Strategy 1: Exact Name Match
                    let entry = wikiData.find(w => w.name === name)
                    
                    // Strategy 2: Filename Match (fallback)
                    // Users might type [[FileName]] which differs from frontmatter Title
                    if (!entry) {
                        const targetName = name.trim().normalize()
                        entry = wikiData.find(w => {
                            const filename = w.id.split(/[\\/]/).pop()?.replace(/\.md$/i, '').normalize() || ''
                            return filename === targetName
                        })
                    }
                    return entry
                })
                .filter(entry => entry !== undefined) as WikiEntry[]
            
            let referencedContext = ''
            if (referencedEntries.length > 0) {
                console.log('[AIWriterPanel] Found referenced entries:', referencedEntries.map(e => e.name))
                referencedContext = '\n\n[REFERENCED WIKI ENTRIES - 사용자가 명시적으로 언급한 자료입니다. 반드시 이 내용을 바탕으로 답변하세요]\n'
                referencedEntries.forEach(entry => {
                    console.log(`[AIWriterPanel] Injecting ${entry.name}. Content Len: ${entry.content?.length}, Info Keys: ${Object.keys(entry.info || {}).join(', ')}`)
                    
                    referencedContext += `\n## [[${entry.name}]] (${entry.type})\n`
                    referencedContext += `파일: ${entry.id}\n`
                    if (entry.description) referencedContext += `설명: ${entry.description}\n`
                    
                    // Inject Frontmatter (Critical for Analysis Files)
                    if (entry.info && Object.keys(entry.info).length > 0) {
                        referencedContext += `\n[메타데이터/속성 정보]:\n${JSON.stringify(entry.info, null, 2)}\n`
                    }
                    
                    referencedContext += `\n[본문 내용]:\n${entry.content || '(본문 없음)'}\n`
                    referencedContext += `\n---\n`
                })
            }
            
            const enrichedMessage = `${contentToSend}${referencedContext}${setupContext ? `\n\n[SCENE SETUP - 작가가 이 씬에 대해 설정한 정보입니다. 반드시 참고하세요]\n${setupContext}` : ''}`
            
            console.log('[AIWriterPanel] FINAL MESSAGE TO AI:\n', enrichedMessage)

            // @ts-ignore
            const result = await window.api.interactSceneWriterAgent({
                currentContent,
                userMessage: enrichedMessage,
                context: sceneContext,
                history: newHistory.map(m => ({ 
                    role: m.role === 'user' ? 'client' : 'model', 
                    content: m.content || '',
                }))
            })

            if (result.success) {
                if (result.type === 'tool_call') {
                     setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        toolCall: { name: result.toolName, args: result.args, status: 'pending' } 
                    }])
                    
                     if (result.toolName === 'read_previous_scenes') {
                         // @ts-ignore
                         window.api.getPreviousScenes(sceneContext.chapter, sceneContext.scene, result.args.count || 3)
                            .then((scenes: any[]) => {
                                 const contextText = scenes.map(s => `
[File: ${s.fileName}]
(Title: ${s.title})
${s.content}
--------------------------------------------------
`).join('\n')

                                 const fileNames = scenes.map(s => s.fileName).join(', ')
                                 
                                 setMessages(prev => {
                                     const next = [...prev]
                                     const last = next[next.length - 1]
                                     if (last.toolCall) {
                                         last.toolCall.status = 'success'
                                         last.toolCall.result = fileNames || "No text found."
                                     }
                                     return next
                                 })

                                 const systemMessage = `
[SYSTEM: Tool Output for 'read_previous_scenes']
Files Read: ${fileNames}

${contextText}

(End of Context)
`
                                handleSend("문맥을 확인했습니다. (파일명: " + fileNames + ") 이제 이 씬에 적합한 등장인물을 제안해주세요. propose_characters 도구를 사용하세요." + systemMessage, true)
                            })
                            .catch((err) => {
                                setMessages(prev => {
                                    const next = [...prev]
                                    const last = next[next.length - 1]
                                    if (last.toolCall) {
                                        last.toolCall.status = 'success' 
                                        last.toolCall.result = "Error: " + err
                                    }
                                    return next
                                })
                            })
                         return 
                     }

                     if (result.toolName === 'get_character_info') {
                          // Build real character context from wiki data
                          const requestedNames: string[] = result.args.names || []
                          const foundChars = requestedNames.map(name => {
                              const found = wikiData.find(w => w.name.toLowerCase() === name.toLowerCase() && w.type === 'character')
                              if (found) {
                                  const info = (found as any).info || {}
                                  return `[${found.name}]\n역할: ${info.role || '불명'}\n소속: ${info.affiliation || '불명'}\n상태: ${info.status || '불명'}\n이명: ${info.alias || '없음'}\n설명: ${found.description || '없음'}`
                              }
                              return `[${name}] - 위키에서 찾을 수 없음`
                          })

                          setTimeout(() => {
                               setMessages(prev => {
                                   const next = [...prev]
                                   const last = next[next.length - 1]
                                   if (last.toolCall) {
                                       last.toolCall.status = 'success'
                                       last.toolCall.result = requestedNames.join(', ') + ' 정보 확인됨'
                                   }
                                   return next
                               })
                               const charContext = `[SYSTEM: Character Info]\n${foundChars.join('\n\n')}`
                               handleSend("캐릭터 정보를 확인했습니다.\n" + charContext, true)
                          }, 500)
                          return
                     }

                     // GenUI Tools — Don't auto-resolve, wait for user interaction
                     // propose_characters, propose_locations, propose_focus are handled by UI callbacks
                     // propose_plot_options and write_scene_content are also interactive
                     // All of these just stay as 'pending' until user clicks confirm

                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: result.content }])
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + result.error }])
                if (text === undefined) setInput(contentToSend)
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Connection failed." }])
            if (text === undefined) setInput(contentToSend)
        } finally {
            setLoading(false)
        }
    }

    const handlePlotSelect = (option: any) => {
        const prompt = `선택한 플롯: "${option.title}". ${option.description}. 이 방향으로 씬을 작성해주세요. write_scene_content 도구를 사용하세요.`
        handleSend(prompt)
    }

    // GenUI Handlers: Character, Location, Focus confirmations (Context Accumulation)
    const getSessionSummary = () => {
        const s = genUISession.current
        let summary = `[현재까지 확정된 씬 설정]`
        if (s.mainCharacters.length > 0) summary += `\n- 주요 등장인물: ${s.mainCharacters.join(', ')}`
        if (s.backgroundCharacters.length > 0) summary += `\n- 배경 인물: ${s.backgroundCharacters.join(', ')}`
        if (s.locations.length > 0) summary += `\n- 장소: ${s.locations.join(', ')}`
        if (s.focusElements.length > 0) summary += `\n- 포커스 요소: ${s.focusElements.join(', ')}`
        return summary
    }

    const handleCharacterConfirm = useCallback((msgIdx: number, mainChars: string[], bgChars: string[]) => {
        // Update session
        genUISession.current.mainCharacters = mainChars
        genUISession.current.backgroundCharacters = bgChars

        // Mark UI as confirmed
        setMessages(prev => {
            const next = [...prev]
            if (next[msgIdx]?.toolCall) next[msgIdx].toolCall!.status = 'success'
            return next
        })

        const mainStr = mainChars.join(', ')
        const bgStr = bgChars.length > 0 ? `\n배경 인물: ${bgChars.join(', ')}` : ''
        const contextSummary = getSessionSummary()

        handleSend(`등장인물을 확정합니다.\n주요 등장: ${mainStr}${bgStr}\n\n${contextSummary}\n\n위 확정된 등장인물들이 자연스럽게 대화하고 행동할 수 있는, 이 씬에 적합한 장소를 제안해주세요. propose_locations 도구를 사용하세요.`, true)
    }, [])

    const handleLocationConfirm = useCallback((msgIdx: number, locations: string[]) => {
        // Update session
        genUISession.current.locations = locations

        setMessages(prev => {
            const next = [...prev]
            if (next[msgIdx]?.toolCall) next[msgIdx].toolCall!.status = 'success'
            return next
        })
        
        const contextSummary = getSessionSummary()

        handleSend(`장소를 확정합니다: ${locations.join(', ')}\n\n${contextSummary}\n\n위 확정된 등장인물과 장소를 바탕으로, 이 씬에서 다룰만한 핵심 포커스 요소를 제안해주세요. propose_focus 도구를 사용하세요.`, true)
    }, [])

    const handleFocusConfirm = useCallback((msgIdx: number, focuses: any[]) => {
        // Update session
        genUISession.current.focusElements = focuses.map((f: any) => `${f.name}(${f.type})`)

        setMessages(prev => {
            const next = [...prev]
            if (next[msgIdx]?.toolCall) next[msgIdx].toolCall!.status = 'success'
            return next
        })
        
        const contextSummary = getSessionSummary()
        
        handleSend(`포커스 요소를 확정합니다.\n\n${contextSummary}\n\n이제 위 모든 확정된 설정(등장인물, 장소, 포커스)을 반드시 반영하여 3가지 플롯 옵션을 제안해주세요. propose_plot_options 도구를 사용하세요.`, true)
    }, [])

    const handleApplyDraft = (text: string) => {
        onApplyContent(text)
        onClose()
    }

    return (
        <div className={`flex flex-col bg-[#111113] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
            mode === 'sandbox' 
                ? 'fixed inset-0 w-screen h-screen z-[100] border-none' 
                : 'absolute right-0 top-0 bottom-0 h-full w-[450px] z-50 border-l border-slate-800/50'
        }`}>
            {mode === 'sandbox' ? (
                <div className="h-full relative animate-in fade-in zoom-in-95 duration-300">
                    <StorySandbox 
                        initialHistory={messages} 
                        wikiData={wikiData} 
                        plotData={plotData} 
                        sceneContext={sceneContext}
                        onRefresh={fetchPlotData}
                    />
                    <div className="absolute top-3.5 right-4 flex gap-2 z-50">
                        <button 
                            onClick={() => setMode('chat')} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-slate-800 text-slate-300 rounded-full border border-white/5 backdrop-blur-md transition-all text-xs font-medium"
                        >
                            <Bot size={14} /> Back to Agent
                        </button>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 bg-black/40 hover:bg-slate-800 text-slate-300 rounded-full border border-white/5 backdrop-blur-md transition-all"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <>
            {/* Header */}
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg text-white shadow-lg shadow-purple-500/20">
                        <Bot size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">AI Writer</h3>
                        <p className="text-[10px] text-slate-500">Agentic Mode · Ch.{sceneContext.chapter}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setMode('sandbox')}
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-amber-500 transition-colors"
                        title="Open Story Sandbox"
                    >
                        <LayoutTemplate size={16} />
                    </button>
                    <SetupSummaryBadge setup={sceneSetup} />
                    <button onClick={handleCopyHistory} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <BookOpen size={14} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Scene Setup Panel (Collapsible) */}
            <div className="border-b border-slate-800 shrink-0">
                <button 
                    onClick={() => setIsSetupOpen(!isSetupOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-900/50 transition-colors group"
                >
                    <div className="flex items-center gap-2">
                        <Target size={13} className="text-purple-400" />
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">씬 설정</span>
                        <span className="text-[9px] text-slate-600">Scene Setup</span>
                    </div>
                    {isSetupOpen ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                </button>
                
                {isSetupOpen && (
                    <div className="px-4 pb-3 space-y-3 animate-in slide-in-from-top-2 duration-200 bg-slate-950/30">
                        {/* Main Characters */}
                        <WikiSelector
                            label="등장인물"
                            icon={Users}
                            items={characters}
                            selected={sceneSetup.mainCharacters}
                            onToggle={toggleItem('mainCharacters')}
                            color="blue"
                            placeholder="캐릭터 검색..."
                        />

                        {/* Background Characters */}
                        <WikiSelector
                            label="배경인물"
                            icon={User}
                            items={characters}
                            selected={sceneSetup.backgroundCharacters}
                            onToggle={toggleItem('backgroundCharacters')}
                            color="amber"
                            placeholder="배경인물 검색..."
                        />

                        {/* Locations */}
                        <WikiSelector
                            label="장소"
                            icon={MapPin}
                            items={locations}
                            selected={sceneSetup.locations}
                            onToggle={toggleItem('locations')}
                            color="emerald"
                            placeholder="장소 검색..."
                        />

                        {/* Focus Elements — All Wiki Types */}
                        <WikiSelector
                            label="포커스 요소"
                            icon={Target}
                            items={allItems}
                            selected={sceneSetup.focusElements}
                            onToggle={toggleItem('focusElements')}
                            color="purple"
                            placeholder="아이템, 세력, 캐릭터 등..."
                        />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role === 'user' ? null : (
                            <span className="text-[10px] font-bold text-slate-500 ml-1">Agent</span>
                        )}

                        {msg.content && (
                            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-900/20' 
                                : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700/50'
                            }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        )}

                        {msg.toolCall && (
                            <div className="w-full max-w-[95%]">
                                {msg.toolCall.name === 'read_previous_scenes' || msg.toolCall.name === 'get_character_info' ? (
                                    <ReadingCard args={msg.toolCall.args} name={msg.toolCall.name} status={msg.toolCall.status} result={msg.toolCall.result} />
                                ) : msg.toolCall.name === 'propose_characters' ? (
                                    <CharacterProposalCard
                                        args={msg.toolCall.args}
                                        wikiData={wikiData}
                                        onConfirm={(main, bg) => handleCharacterConfirm(idx, main, bg)}
                                        confirmed={msg.toolCall.status === 'success'}
                                    />
                                ) : msg.toolCall.name === 'propose_locations' ? (
                                    <LocationProposalCard
                                        args={msg.toolCall.args}
                                        wikiData={wikiData}
                                        onConfirm={(locs) => handleLocationConfirm(idx, locs)}
                                        confirmed={msg.toolCall.status === 'success'}
                                    />
                                ) : msg.toolCall.name === 'propose_focus' ? (
                                    <FocusProposalCard
                                        args={msg.toolCall.args}
                                        onConfirm={(focuses) => handleFocusConfirm(idx, focuses)}
                                        confirmed={msg.toolCall.status === 'success'}
                                    />
                                ) : msg.toolCall.name === 'propose_plot_options' ? (
                                    <PlotOptionsContainer 
                                        args={msg.toolCall.args} 
                                        onSelect={handlePlotSelect} 
                                    />
                                ) : msg.toolCall.name === 'write_scene_content' ? (
                                    <DraftProposalCard 
                                        args={msg.toolCall.args} 
                                        onAccept={() => handleApplyDraft(msg.toolCall!.args.outline)}
                                        onReject={() => {}} 
                                    />
                                ) : null}
                            </div>
                        )}
                    </div>
                ))}
                
                {loading && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs px-2 animate-pulse">
                        <Bot size={12} />
                        <span>Thinking...</span>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800 bg-[#111113] shrink-0">
                {/* Mention Chips (Selected Files) */}
                {mentionedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 animate-in slide-in-from-bottom-2">
                        {mentionedFiles.map((file, i) => (
                             <div 
                                key={`${file.name}-${i}`} 
                                className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2 py-1 rounded-md text-[10px] text-slate-300 group hover:border-blue-500/50 transition-colors"
                                title={file.id} // Toolkit showing full path
                             >
                                 <span className={file.type === 'other' && file.id === 'Not found in wiki' ? 'text-slate-500' : 'text-blue-400'}>
                                     {getIconForType(file.type)}
                                 </span>
                                 <span className="font-medium max-w-[120px] truncate">{file.name}</span>
                                 <button 
                                    onClick={() => removeMention(file.name)} 
                                    className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                     <X size={10} />
                                 </button>
                             </div>
                        ))}
                    </div>
                )}

                <div className="relative">
                    {/* Mention Suggestions Popup */}
                    {mentionState.active && mentionItems.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 flex flex-col gap-0.5 p-1 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-2 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-950/50 rounded flex items-center justify-between">
                                <span>SUGGESTIONS</span>
                                <span className="text-[9px]">ENTER to select</span>
                            </div>
                            {mentionItems.map((item, idx) => (
                                <button 
                                    key={item.id}
                                    onClick={() => confirmMention(item)}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-3 rounded-md transition-colors ${
                                        idx === mentionState.index 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-slate-300 hover:bg-slate-800'
                                    }`}
                                >
                                   {getIconForType(item.type)}
                                   <div className="flex-1 min-w-0">
                                       <div className="font-bold truncate">{item.name}</div>
                                       <div className={`text-[9px] truncate ${idx === mentionState.index ? 'text-blue-200' : 'text-slate-500'}`}>{item.id}</div>
                                   </div>
                                   <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                       idx === mentionState.index ? 'border-blue-400 bg-blue-500/30' : 'border-slate-700 bg-slate-800'
                                   }`}>
                                       {item.type.toUpperCase()}
                                   </span>
                                </button>
                            ))}
                        </div>
                    )}

                    <input 
                        ref={inputRef}
                        type="text" 
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder="이야기를 시작해보세요..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all shadow-inner"
                        disabled={loading}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-2 p-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white disabled:opacity-50 transition-colors shadow-lg shadow-purple-500/20"
                    >
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
                </>
            )}
        </div>
    )
}
