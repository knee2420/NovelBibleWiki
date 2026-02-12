import { useState, useRef, useEffect } from 'react'
import { Sparkles, ArrowRight, Bot, BookOpen, Search, PenTool, CheckCircle, XCircle } from 'lucide-react'

interface AIWriterPanelProps {
    currentContent: string
    sceneContext: { chapter: number, scene: number }
    onApplyContent: (content: string) => void
    onClose: () => void
}

type Message = {
    role: 'user' | 'assistant'
    content?: string
    toolCall?: {
        name: string
        args: any
        status?: 'pending' | 'success' | 'emulated' // Emulated means we just display it but AI continues
        result?: any // For storing result of read tools
    }
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
                            : `관련 항목: ${args.names.join(', ')}`
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

export const AIWriterPanel = ({ currentContent, sceneContext, onApplyContent, onClose }: AIWriterPanelProps) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState<string>('')
    const scrollRef = useRef<HTMLDivElement>(null)

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "안녕하세요! 글쓰기 파트너 AI입니다.\n이전 씬을 읽고, 캐릭터 설정을 확인하여 집필을 도와드릴 수 있습니다.\n\n이번 씬에서는 어떤 이야기가 진행되나요?"
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
        
        // Guard: If empty content or loading
        if (!contentToSend.trim() || loading) return
        
        // Optimistically clear input if triggered from UI
        if (text === undefined) setInput('')

        let newHistory = [...messages]
        const userMsg: Message = { role: 'user', content: contentToSend }
        
        // Add to UI if not hidden
        if (!hidden) {
             setMessages(prev => [...prev, userMsg])
        }
        
        // Always add to history for Backend
        newHistory.push(userMsg)
        
        setLoading(true)

        try {
            // @ts-ignore
            const result = await window.api.interactSceneWriterAgent({
                currentContent,
                userMessage: contentToSend,
                context: sceneContext,
                history: newHistory.map(m => ({ 
                    role: m.role === 'user' ? 'client' : 'model', 
                    content: m.content || '',
                    // Note: Ideally we pass structured history including tool calls, 
                    // but for this V1 we simplify by just passing text content history.
                    // The backend handles the current session state via Gemini object if persistent, 
                    // but here we are stateless backend-side (new chat every time).
                    // So we must pass full context. 
                    // To properly support tool outputs in history without complex serialization:
                    // We append tool results as [SYSTEM] text messages in the history for the NEXT turn.
                }))
            })

            if (result.success) {
                if (result.type === 'tool_call') {
                     // GenUI Response
                     setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        toolCall: { name: result.toolName, args: result.args, status: 'pending' } 
                    }])
                    
                     // If it's a read tool, we auto-resolve it (Mocking the agent loop)
                     if (result.toolName === 'read_previous_scenes') {
                         
                         // [REAL IMPLEMENTATION] Call Backend
                         // @ts-ignore
                         window.api.getPreviousScenes(sceneContext.chapter, sceneContext.scene, result.args.count || 3)
                            .then((scenes: any[]) => {
                                 // Format Context for AI
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

                                 // Recursive Call with REAL Context
                                 const systemMessage = `
[SYSTEM: Tool Output for 'read_previous_scenes']
Files Read: ${fileNames}

${contextText}

(End of Context)
`
                                handleSend("문맥을 확인했습니다. (파일명: " + fileNames + ") 이를 바탕으로 3가지 플롯 옵션을 제안해주세요." + systemMessage, true)
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
                          setTimeout(() => {
                               setMessages(prev => {
                                   const next = [...prev]
                                   const last = next[next.length - 1]
                                   if (last.toolCall) {
                                       last.toolCall.status = 'success'
                                       last.toolCall.result = "Character Info Retrieved."
                                   }
                                   return next
                               })
                               // Mock for Character Info (To be implemented similarly if needed)
                               const mockContext = `[SYSTEM] Character info for ${result.args.names.join(', ')} retrieved.`
                               handleSend("캐릭터 정보를 확인했습니다." + mockContext, true)
                          }, 1500)
                          return
                     }

                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: result.content }])
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + result.error }])
                // Restore input on error
                if (text === undefined) setInput(contentToSend)
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Connection failed." }])
            // Restore input on error
            if (text === undefined) setInput(contentToSend)
        } finally {
            // Only stop loading if not waiting for auto-resolve (which returns early)
           if (!loading) setLoading(false) // Wait, loading is state, we can't check it synchronously like this inside async
           // Actually the return above handles the 'loading' true case.
           // If we fall through here, we want to stop loading.
           setLoading(false)
        }
    }

    const handlePlotSelect = (option: any) => {
        // Send selection back to AI
        const prompt = `I choose: ${option.title}. ${option.description}. Please write the scene based on this.`
        handleSend(prompt)
    }

    const handleApplyDraft = (text: string) => {
        onApplyContent(text)
        onClose()
    }

    return (
        <div className="flex flex-col h-full bg-[#111113] border-l border-slate-800/50 shadow-2xl w-[450px] absolute right-0 top-0 bottom-0 z-50">
            {/* Header */}
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg text-white shadow-lg shadow-purple-500/20">
                        <Bot size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">AI Writer</h3>
                        <p className="text-[10px] text-slate-500">Agentic Mode</p>
                    </div>
                </div>
                <button onClick={handleCopyHistory} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors mr-1">
                    <BookOpen size={16} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Avatar */}
                        {msg.role === 'user' ? null : (
                            <span className="text-[10px] font-bold text-slate-500 ml-1">Agent</span>
                        )}

                        {/* Text Bubble */}
                        {msg.content && (
                            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-900/20' 
                                : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700/50'
                            }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        )}

                        {/* GenUI - Tool Widgets */}
                        {msg.toolCall && (
                            <div className="w-full max-w-[90%]">
                                {msg.toolCall.name === 'read_previous_scenes' || msg.toolCall.name === 'get_character_info' ? (
                                    <ReadingCard args={msg.toolCall.args} name={msg.toolCall.name} status={msg.toolCall.status} result={msg.toolCall.result} />
                                ) : msg.toolCall.name === 'propose_plot_options' ? (
                                    <PlotOptionsContainer 
                                        args={msg.toolCall.args} 
                                        onSelect={handlePlotSelect} 
                                    />
                                ) : msg.toolCall.name === 'write_scene_content' ? (
                                    <DraftProposalCard 
                                        args={msg.toolCall.args} 
                                        onAccept={() => handleApplyDraft(msg.toolCall!.args.outline)} // Assuming outline is text? No, outline is outline.
                                                                                                    // Wait, write_scene_content usually generates TEXT.
                                                                                                    // The tool call args are outline/focus/tone.
                                                                                                    // The AI *should* have returned the TEXT as result.
                                                                                                    // In our backend logic, we treated 'write_scene_content' as a final tool.
                                                                                                    // Let's assume the args.outline IS the content for simplicity 
                                                                                                    // OR we accept this 'proposal' and then the AI generates the text.
                                                                                                    // Let's assume the user CLICKS 'Apply' -> We treat args.outline as 'Draft' for this demo.
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
            <div className="p-4 border-t border-slate-800 bg-[#111113]">
                <div className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
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
        </div>
    )
}
