import { useState, useEffect } from 'react'
import { Sparkles, Check, X, RotateCcw, Key, Activity, Heart, UserPlus, ArrowRight } from 'lucide-react'
import { aiService } from '../../services/aiService'
import { SceneSchema } from '../../../../shared/types/scene-schema'

interface AIAnalyzePanelProps {
  initialText?: string
  onApply: (data: any) => void
  onClose: () => void
}

export const AIAnalyzePanel = ({ initialText = '', onApply, onClose }: AIAnalyzePanelProps) => {
  const [inputText, setInputText] = useState(initialText)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<Partial<SceneSchema> | null>(null)
  
  // [NEW] API Key State
  const [hasKey, setHasKey] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)

  useEffect(() => {
    checkKey()
  }, [])

  const checkKey = async () => {
    const exists = await aiService.hasApiKey()
    setHasKey(exists)
    if (!exists) setShowKeyInput(true)
  }

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return
    const success = await aiService.saveApiKey(apiKeyInput)
    if (success) {
      setHasKey(true)
      setShowKeyInput(false)
      alert('API Key saved!')
    }
  }

  const handleAnalyze = async () => {
    if (!inputText.trim()) return
    
    if (!hasKey) {
      setShowKeyInput(true)
      return
    }

    setIsAnalyzing(true)
    try {
      const data = await aiService.analyzeScene(inputText)
      setResult(data)
    } catch (error: any) {
      console.error(error)
      if (error.message.includes('API Key not found')) {
         setHasKey(false)
         setShowKeyInput(true)
         alert('API Key가 없거나 유효하지 않습니다.')
      } else {
         alert('분석 실패: ' + error.message)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApply = () => {
    if (result) {
      onApply(result)
      onClose()
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700 w-[450px] shadow-2xl animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0 z-30">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          Smart Analyze (Gemini)
        </h3>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* [NEW] API Key Input Area */}
        {(!hasKey || showKeyInput) && (
           <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                 <Key size={14} /> Gemini API Key Required
              </div>
              <p className="text-[10px] text-amber-200/80">
                 Google AI Studio에서 발급받은 키를 입력해주세요.
              </p>
              <div className="flex gap-2">
                 <input 
                   type="password" 
                   value={apiKeyInput}
                   onChange={(e) => setApiKeyInput(e.target.value)}
                   className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                   placeholder="AIzaSy..."
                 />
                 <button 
                   onClick={handleSaveKey}
                   className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold"
                 >
                   Save
                 </button>
              </div>
           </div>
        )}

        {/* Step 1: Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">1. 본문 텍스트</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:border-purple-500 outline-none resize-none"
            placeholder="분석할 씬의 본문을 여기에 붙여넣거나 수정하세요."
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${
                isAnalyzing
                  ? 'bg-slate-800 text-slate-500 cursor-wait'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20'
              }`}
          >
            {isAnalyzing ? (
              <>Gemini가 분석 중...</>
            ) : (
              <>
                <Sparkles size={14} /> AI 분석 실행
              </>
            )}
          </button>
        </div>

        {/* Step 2: Result Preview */}
        {result && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-green-400 uppercase">2. 분석 결과</label>
              <button 
                onClick={() => setResult(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                <RotateCcw size={10} /> 다시 하기
              </button>
            </div>
            
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-4 text-xs">
              {/* Basic Info */}
              <div className="space-y-3 pb-3 border-b border-slate-800/50">
                <div>
                  <span className="text-slate-500 block mb-1">제목 (ep.{result.chapter}-{result.scene})</span>
                  <div className="text-slate-200 font-bold">{result.title}</div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">요약</span>
                  <div className="text-slate-300 leading-relaxed bg-slate-900 p-2 rounded border border-slate-800/50">
                    {result.summary}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block mb-1">등장인물</span>
                    <div className="flex flex-wrap gap-1">
                      {result.characters?.map((c: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] border border-indigo-500/20">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">장소</span>
                    <div className="flex flex-wrap gap-1">
                      {result.locations?.map((l: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] border border-emerald-500/20">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wiki Data / Graph Info */}
              {result['wiki-data'] && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 font-bold border-b border-slate-800/50 pb-1 mb-2">
                    <Activity size={12} /> Graph Data
                  </div>

                  {/* Appear / Disappear */}
                  {(result['wiki-data'].appear?.length || 0) > 0 && (
                    <div>
                         <span className="text-slate-500 block mb-1 flex items-center gap-1"><UserPlus size={10} /> 첫 등장 / 아이템</span>
                        <div className="flex flex-wrap gap-1">
                        {result['wiki-data'].appear?.map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] border border-blue-500/20">{c}</span>
                        ))}
                        </div>
                    </div>
                  )}

                   {/* Updates */}
                   {(result['wiki-data'].update?.length || 0) > 0 && (
                     <div>
                        <span className="text-slate-500 block mb-1">상태 업데이트</span>
                        <div className="space-y-1">
                          {result['wiki-data'].update?.map((u, i) => (
                            <div key={i} className="bg-slate-900 p-2 rounded border border-slate-800/50">
                                <div className="font-bold text-amber-400 mb-1">{u.name}</div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                    {Object.entries(u.changes).map(([k, v]) => (
                                        <div key={k} className="flex gap-1">
                                            <span className="text-slate-500">{k}:</span>
                                            <span className="text-slate-300">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}

                   {/* Relations */}
                   {(result['wiki-data'].relations?.length || 0) > 0 && (
                     <div>
                        <span className="text-slate-500 block mb-1">관계 / 상태 변화</span>
                         <div className="space-y-1">
                          {result['wiki-data'].relations?.map((r, i) => (
                             <div key={i} className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800/50 text-[10px]">
                                <div className="flex items-center gap-1 text-slate-300">
                                    <span className="font-bold text-indigo-300">{r.source}</span>
                                    <ArrowRight size={10} className="text-slate-600" />
                                    <span className="font-bold text-indigo-300">{r.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{r.display}</span>
                                    {r.mood === 'FRIENDLY' && <Heart size={10} className="text-green-500" />}
                                    {r.mood === 'HOSTILE' && <X size={10} className="text-red-500" />}
                                </div>
                             </div>
                          ))}
                         </div>
                     </div>
                   )}
                </div>
              )}

              {/* Tags */}
              {result.tags && result.tags.length > 0 && (
                <div>
                    <span className="text-slate-500 block mb-1">태그</span>
                    <div className="flex flex-wrap gap-1">
                    {result.tags.map((t: string, i: number) => (
                        <span key={i} className="text-[10px] text-slate-400">#{t}</span>
                    ))}
                    </div>
                </div>
              )}
            </div>

            <button
              onClick={handleApply}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all"
            >
              <Check size={16} /> 적용하기 (Apply)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

