
import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Sparkles, Save, Eraser, ArrowRight } from 'lucide-react'
import { WikiEntry } from '../../types/wiki'
import ReactMarkdown from 'react-markdown'

interface AgentChatPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedEntries: WikiEntry[]
  onSaveEpisode: (title: string, content: string, tags: string[]) => Promise<string | void>
  onNavigateToEpisode?: (id: string) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isEpisodeDraft?: boolean // If true, show "Save" button
  savedEpisodeId?: string // [NEW] If saved, store ID to navigate
}

export const AgentChatPanel = ({
  isOpen,
  onClose,
  selectedEntries,
  onSaveEpisode,
  onNavigateToEpisode
}: AgentChatPanelProps) => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial Greeting when opened with new characters
  useEffect(() => {
    if (isOpen && selectedEntries.length > 0 && messages.length === 0) {
      const names = selectedEntries.map(e => e.name).join(', ')
      setMessages([
        {
          id: 'init',
          role: 'assistant',
          content: `**${names}** (이)가 선택되었습니다.\n\n이 캐릭터들로 어떤 에피소드를 만들까요? 상황이나 아이디어를 말씀해 주세요.`,
          timestamp: new Date()
        }
      ])
    }
  }, [isOpen, selectedEntries])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI Generation (Replace with actual API call later)
    setTimeout(() => {
      const contextTags = selectedEntries.flatMap(e => e.tags || [])
      const contextNames = selectedEntries.map(e => e.name).join(', ')
      
      // const draftTitle = `[생성됨] ${contextNames}의 에피소드` // Unused
      const draftContent = `
# ${contextNames}의 이야기

**등장인물**: ${contextNames}
**키워드**: ${contextTags.join(', ')}

이것은 AI가 생성한 에피소드 초안입니다. 사용자의 요청 "${userMsg.content}"에 기반하여 작성되었습니다.

(여기에 실제 AI 생성 내용이 들어갑니다...)

이 에피소드는 자동으로 저장될 수 있습니다.
`
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: draftContent,
        timestamp: new Date(),
        isEpisodeDraft: true
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleSave = async (msg: ChatMessage) => {
      if (!msg.isEpisodeDraft) return
      
      // Extract generic title and content for now. 
      // In a real app, strict JSON output from AI would be better.
      const lines = msg.content.split('\n')
      const titleLine = lines.find(l => l.startsWith('# ')) || lines[0]
      const title = titleLine.replace(/^#\s*/, '').replace(/[*`]/g, '').trim() || 'Untitled Episode'
      const content = msg.content
      const tags = selectedEntries.map(e => e.name)

      const savedId = await onSaveEpisode(title, content, tags)
      
      // Add confirmation message
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ **"${title}"** 에피소드가 성공적으로 저장되었습니다!\n\n'에피소드 저장소'의 [사용 가능] 탭에서 확인하실 수 있습니다.`,
          timestamp: new Date(),
          savedEpisodeId: savedId || undefined
      }])
  }

  // Clear chat
  const handleClear = () => {
      setMessages([])
  }

  return (
    <div
      className={`fixed top-0 right-0 h-screen w-[400px] bg-[#11121c] border-l border-slate-800 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-[#0b0e14]">
        <div className="flex items-center gap-2 text-blue-400 font-bold">
          <Sparkles size={18} />
          <span>Agent Mode Check</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleClear} className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors" title="Clear Chat">
                <Eraser size={16} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X size={20} />
            </button>
        </div>
      </div>

      {/* Selected Items Context Bar */}
      {selectedEntries.length > 0 && (
          <div className="bg-slate-900 border-b border-slate-800 p-3 overflow-x-auto custom-scrollbar flex gap-2 shrink-0">
              {selectedEntries.map(entry => (
                  <div key={entry.id} className="flex-shrink-0 flex items-center gap-2 bg-[#1e293b] text-xs text-slate-200 px-2 py-1 rounded border border-slate-700">
                      {entry.image && <img src={entry.image} className="w-4 h-4 rounded-full object-cover" />}
                      <span>{entry.name}</span>
                  </div>
              ))}
          </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0b0c15]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                ${msg.role === 'assistant' ? 'bg-blue-600' : 'bg-slate-700'}
            `}>
                {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-slate-300" />}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col max-w-[85%] space-y-2`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                        ? 'bg-slate-800 text-slate-200 rounded-tr-none' 
                        : 'bg-[#1e293b] text-slate-300 rounded-tl-none border border-slate-700/50'}
                `}>
                <div className="prose prose-invert prose-sm max-w-none">
                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                </div>

                {/* Save Action for AI response */}
                {msg.role === 'assistant' && msg.isEpisodeDraft && (
                    <button 
                        onClick={() => handleSave(msg)}
                        className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-green-600/10 text-green-400 border border-green-600/30 rounded-lg text-xs font-bold hover:bg-green-600/20 transition-colors"
                    >
                        <Save size={14} /> 에피소드 저장하기
                    </button>
                )}

                {/* [NEW] Navigation Action after Save */}
                {msg.role === 'assistant' && msg.savedEpisodeId && onNavigateToEpisode && (
                    <button 
                        onClick={() => onNavigateToEpisode(msg.savedEpisodeId!)}
                        className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <ArrowRight size={14} /> 에피소드 확인하러 가기
                    </button>
                )}
            </div>
          </div>
        ))}
        {isTyping && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 animate-pulse">
                    <Bot size={16} className="text-white" />
                </div>
                <div className="bg-[#1e293b] rounded-2xl px-4 py-3 rounded-tl-none border border-slate-700/50 text-slate-400 text-xs flex items-center">
                    Generating...
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#11121c] border-t border-slate-800 z-10 relative">
        <div className="relative z-10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder={selectedEntries.length > 0 ? "이 캐릭터들로 이야기를 만들어보세요..." : "먼저 캐릭터를 선택해주세요."}
            disabled={selectedEntries.length === 0}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none resize-none h-14 relative z-20 pointer-events-auto"
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || selectedEntries.length === 0}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-[10px] text-slate-500 text-center mt-2">
            AI가 생성한 내용은 부정확할 수 있습니다. (Agent Mode v1.0)
        </div>
      </div>
    </div>
  )
}
